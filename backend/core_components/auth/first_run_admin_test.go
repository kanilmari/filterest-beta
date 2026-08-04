// first_run_admin_test.go
// Verifies the first administrator form's fail-closed state and input boundary.
package auth

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
)

var firstRunTransactionDriverCounter int64

type firstRunTransactionState struct {
	committed      bool
	rolledBack     bool
	credentialMade bool
	configClosed   bool
	failCredential bool
}

type firstRunTransactionDriver struct{ state *firstRunTransactionState }
type firstRunTransactionConn struct{ state *firstRunTransactionState }
type firstRunTransactionTx struct{ state *firstRunTransactionState }
type firstRunTransactionRows struct {
	values []driver.Value
	done   bool
}

func (d *firstRunTransactionDriver) Open(string) (driver.Conn, error) {
	return &firstRunTransactionConn{state: d.state}, nil
}

func (c *firstRunTransactionConn) Prepare(string) (driver.Stmt, error) {
	return nil, errors.New("prepare is not supported")
}
func (c *firstRunTransactionConn) Close() error { return nil }
func (c *firstRunTransactionConn) Begin() (driver.Tx, error) {
	return &firstRunTransactionTx{state: c.state}, nil
}
func (tx *firstRunTransactionTx) Commit() error {
	tx.state.committed = true
	return nil
}
func (tx *firstRunTransactionTx) Rollback() error {
	tx.state.rolledBack = true
	return nil
}
func (r *firstRunTransactionRows) Columns() []string { return []string{"value"} }
func (r *firstRunTransactionRows) Close() error      { return nil }
func (r *firstRunTransactionRows) Next(destination []driver.Value) error {
	if r.done || len(r.values) == 0 {
		return io.EOF
	}
	r.done = true
	copy(destination, r.values)
	return nil
}

func (c *firstRunTransactionConn) QueryContext(_ context.Context, query string, _ []driver.NamedValue) (driver.Rows, error) {
	switch {
	case strings.Contains(query, "FOR UPDATE"):
		return &firstRunTransactionRows{values: []driver.Value{true}}, nil
	case strings.Contains(query, "JOIN restricted.users_restricted"):
		return &firstRunTransactionRows{}, nil
	case strings.Contains(query, "lower(username)"):
		return &firstRunTransactionRows{}, nil
	case strings.Contains(query, "lower(email)"):
		return &firstRunTransactionRows{}, nil
	case strings.Contains(query, "SELECT id FROM system_user_groups"):
		return &firstRunTransactionRows{values: []driver.Value{int64(1)}}, nil
	case strings.Contains(query, "INSERT INTO system_users"):
		return &firstRunTransactionRows{values: []driver.Value{int64(42)}}, nil
	default:
		return nil, fmt.Errorf("unexpected query: %s", query)
	}
}

func (c *firstRunTransactionConn) ExecContext(_ context.Context, query string, _ []driver.NamedValue) (driver.Result, error) {
	switch {
	case strings.Contains(query, "system_user_group_memberships"):
		return driver.RowsAffected(1), nil
	case strings.Contains(query, "restricted.users_restricted"):
		if c.state.failCredential {
			return nil, errors.New("credential insert failed")
		}
		c.state.credentialMade = true
		return driver.RowsAffected(1), nil
	case strings.Contains(query, "UPDATE system_config"):
		c.state.configClosed = true
		return driver.RowsAffected(1), nil
	default:
		return nil, fmt.Errorf("unexpected exec: %s", query)
	}
}

func openFirstRunTransactionDB(t *testing.T, state *firstRunTransactionState) *sql.DB {
	t.Helper()
	name := fmt.Sprintf("first_run_transaction_%d", atomic.AddInt64(&firstRunTransactionDriverCounter, 1))
	sql.Register(name, &firstRunTransactionDriver{state: state})
	db, err := sql.Open(name, "")
	if err != nil {
		t.Fatalf("sql.Open() error = %v", err)
	}
	t.Cleanup(func() { _ = db.Close() })
	return db
}

func TestValidateFirstRunAdminInputAcceptsStrongForm(t *testing.T) {
	errs := validateFirstRunAdminInput(firstRunAdminInput{
		Username:        "owner.admin",
		Email:           "owner@example.com",
		Password:        "correct horse battery staple",
		ConfirmPassword: "correct horse battery staple",
	})
	if errs != (firstRunAdminErrors{}) {
		t.Fatalf("validation errors = %+v, want none", errs)
	}
}

func TestValidateFirstRunAdminInputRejectsUnsafeValues(t *testing.T) {
	errs := validateFirstRunAdminInput(firstRunAdminInput{
		Username:        "x / admin",
		Email:           "not-an-email",
		Password:        "short",
		ConfirmPassword: "different",
	})
	if errs.Username == "" || errs.Email == "" || errs.Password == "" {
		t.Fatalf("validation errors = %+v, want username, email, and password errors", errs)
	}
}

func TestValidateFirstRunAdminInputRejectsPasswordMismatch(t *testing.T) {
	errs := validateFirstRunAdminInput(firstRunAdminInput{
		Username:        "owner",
		Email:           "owner@example.com",
		Password:        "a sufficiently long password",
		ConfirmPassword: "a different long password",
	})
	if errs.Password != "first_run_password_mismatch" {
		t.Fatalf("password error = %q, want mismatch", errs.Password)
	}
}

func TestFirstRunAdminHandlerRedirectsWhenSetupIsClosed(t *testing.T) {
	original := firstRunPendingReader
	firstRunPendingReader = func(context.Context, *sql.DB) (bool, error) { return false, nil }
	t.Cleanup(func() { firstRunPendingReader = original })

	req := httptest.NewRequest(http.MethodGet, "/first-run", nil)
	rr := httptest.NewRecorder()
	FirstRunAdminHandler(rr, req)

	if rr.Code != http.StatusSeeOther {
		t.Fatalf("status = %d, want %d", rr.Code, http.StatusSeeOther)
	}
	if got := rr.Header().Get("Location"); got != "/login" {
		t.Fatalf("Location = %q, want /login", got)
	}
}

func TestFirstRunAdminHandlerFailsClosedWhenStateCannotBeRead(t *testing.T) {
	original := firstRunPendingReader
	firstRunPendingReader = func(context.Context, *sql.DB) (bool, error) { return false, sql.ErrConnDone }
	t.Cleanup(func() { firstRunPendingReader = original })

	req := httptest.NewRequest(http.MethodGet, "/first-run", nil)
	rr := httptest.NewRecorder()
	FirstRunAdminHandler(rr, req)

	if rr.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", rr.Code, http.StatusServiceUnavailable)
	}
}

func TestCreateFirstRunAdminCommitsAccountAndFlagTogether(t *testing.T) {
	state := &firstRunTransactionState{}
	db := openFirstRunTransactionDB(t, state)
	input := firstRunAdminInput{
		Username: "owner", Email: "owner@example.com", Password: "correct horse battery staple",
	}

	if err := createFirstRunAdmin(context.Background(), db, input); err != nil {
		t.Fatalf("createFirstRunAdmin() error = %v", err)
	}
	if !state.credentialMade || !state.configClosed || !state.committed {
		t.Fatalf("transaction state = %+v, want credential, flag closure, and commit", state)
	}
}

func TestCreateFirstRunAdminRollsBackBeforeFlagClosureOnCredentialFailure(t *testing.T) {
	state := &firstRunTransactionState{failCredential: true}
	db := openFirstRunTransactionDB(t, state)
	input := firstRunAdminInput{
		Username: "owner", Email: "owner@example.com", Password: "correct horse battery staple",
	}

	if err := createFirstRunAdmin(context.Background(), db, input); err == nil {
		t.Fatal("createFirstRunAdmin() error = nil, want credential failure")
	}
	if state.committed || state.configClosed || !state.rolledBack {
		t.Fatalf("transaction state = %+v, want rollback without flag closure", state)
	}
}
