// notification_triggers_test.go
// Unit tests for trigger request parsing and helper logic.
// Covers the pure condition/action utilities plus the cheap handler guard branches so the trigger package no longer stays entirely untested between refactors.
package dtt_triggers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"sort"
	"strings"
	"testing"
)

type triggerExecStub struct {
	query    string
	args     []interface{}
	execErr  error
	called   bool
}

func (s *triggerExecStub) Query(string, ...interface{}) (*sql.Rows, error) { return nil, nil }
func (s *triggerExecStub) QueryRow(string, ...interface{}) *sql.Row        { return nil }

func (s *triggerExecStub) Exec(query string, args ...interface{}) (sql.Result, error) {
	s.called = true
	s.query = query
	s.args = append([]interface{}(nil), args...)
	if s.execErr != nil {
		return nil, s.execErr
	}
	return triggerResultStub(1), nil
}

type triggerResultStub int64

func (r triggerResultStub) LastInsertId() (int64, error) { return 0, errors.New("not implemented") }
func (r triggerResultStub) RowsAffected() (int64, error) { return int64(r), nil }

func TestGetTriggersHandlerRejectsWrongMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/system_triggers/list", nil)
	rec := httptest.NewRecorder()

	GetTriggersHandler(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d, want 405", rec.Code)
	}
}

func TestGetTriggersHandlerRequiresTransaction(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/system_triggers/list", nil)
	rec := httptest.NewRecorder()

	GetTriggersHandler(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", rec.Code)
	}
}

func TestCreateTriggerHandlerRejectsWrongMethod(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/system_triggers/create", nil)
	rec := httptest.NewRecorder()

	CreateTriggerHandler(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d, want 405", rec.Code)
	}
}

func TestCreateTriggerHandlerRequiresTransaction(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/system_triggers/create", strings.NewReader(`{}`))
	rec := httptest.NewRecorder()

	CreateTriggerHandler(rec, req)

	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status = %d, want 500", rec.Code)
	}
}

func TestDecodeTriggerRequest(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/system_triggers/create", strings.NewReader(`{
		"source_dataset": "orders",
		"condition": "status = 'paid'",
		"target_dataset": "notifications",
		"action_values": "{\"body\":\"ok\"}"
	}`))

	trigger, err := decodeTriggerRequest(req)
	if err != nil {
		t.Fatalf("decodeTriggerRequest() returned error: %v", err)
	}
	if trigger.SourceTable != "orders" || trigger.TargetTable != "notifications" {
		t.Fatalf("decoded trigger = %#v, want source and target datasets", trigger)
	}
}

func TestInsertTriggerIntoDBUsesExpectedQueryAndArgs(t *testing.T) {
	stub := &triggerExecStub{}
	trigger := &Trigger{
		SourceTable:  "orders",
		Condition:    "status = 'paid'",
		TargetTable:  "notifications",
		ActionValues: `{"body":"ok"}`,
	}

	if err := insertTriggerIntoDB(stub, trigger); err != nil {
		t.Fatalf("insertTriggerIntoDB() returned error: %v", err)
	}
	if !stub.called {
		t.Fatal("Exec was not called")
	}
	if !strings.Contains(stub.query, "INSERT INTO system_triggers") {
		t.Fatalf("query = %q, want insert into system_triggers", stub.query)
	}
	if len(stub.args) != 4 {
		t.Fatalf("args len = %d, want 4", len(stub.args))
	}
	if stub.args[0] != "orders" || stub.args[2] != "notifications" {
		t.Fatalf("args = %#v, want source/target datasets", stub.args)
	}
}

func TestParseCondition(t *testing.T) {
	column, operator, value, err := parseCondition("status = 'paid now'")
	if err != nil {
		t.Fatalf("parseCondition() returned error: %v", err)
	}
	if column != "status" || operator != "=" || value != "'paid now'" {
		t.Fatalf("parseCondition() = (%q, %q, %q)", column, operator, value)
	}

	if _, _, _, err := parseCondition("broken"); err == nil {
		t.Fatal("parseCondition() error = nil, want invalid condition error")
	}
}

func TestCompareStringValues(t *testing.T) {
	tests := []struct {
		name     string
		rowValue interface{}
		value    string
		operator string
		want     bool
	}{
		{name: "equals", rowValue: "paid", value: "paid", operator: "=", want: true},
		{name: "not equals", rowValue: "paid", value: "draft", operator: "!=", want: true},
		{name: "ilike", rowValue: "Paid", value: "paid", operator: "ILIKE", want: true},
		{name: "not ilike", rowValue: "Paid", value: "draft", operator: "NOT ILIKE", want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := compareStringValues(tt.rowValue, tt.value, tt.operator)
			if err != nil {
				t.Fatalf("compareStringValues() returned error: %v", err)
			}
			if got != tt.want {
				t.Fatalf("compareStringValues() = %v, want %v", got, tt.want)
			}
		})
	}

	if _, err := compareStringValues("paid", "paid", "LIKE"); err == nil {
		t.Fatal("compareStringValues() error = nil, want unknown operator error")
	}
}

func TestCompareNumericValuesAndToFloat64(t *testing.T) {
	gt, err := compareNumericValues(json.Number("4.5"), "4.0", ">")
	if err != nil {
		t.Fatalf("compareNumericValues() returned error: %v", err)
	}
	if !gt {
		t.Fatal("compareNumericValues() = false, want true")
	}

	lte, err := compareNumericValues("3.5", "3.5", "<=")
	if err != nil {
		t.Fatalf("compareNumericValues() returned error: %v", err)
	}
	if !lte {
		t.Fatal("compareNumericValues() = false, want true")
	}

	if _, err := compareNumericValues("oops", "3.5", ">"); err == nil {
		t.Fatal("compareNumericValues() error = nil, want numeric conversion error")
	}
	if _, err := toFloat64(struct{}{}); err == nil {
		t.Fatal("toFloat64() error = nil, want conversion error")
	}
}

func TestParseActionValues(t *testing.T) {
	values, err := parseActionValues(`{"body":"{{message}}","count":2}`, map[string]interface{}{
		"message": "hello",
	})
	if err != nil {
		t.Fatalf("parseActionValues() returned error: %v", err)
	}
	if values["body"] != "hello" || values["count"] != float64(2) {
		t.Fatalf("parseActionValues() = %#v, want placeholder replacement and numeric value", values)
	}

	if _, err := parseActionValues(`{"body":"{{missing}}"}`, map[string]interface{}{}); err == nil {
		t.Fatal("parseActionValues() missing placeholder error = nil")
	}
	if _, err := parseActionValues(`{`, map[string]interface{}{}); err == nil {
		t.Fatal("parseActionValues() invalid JSON error = nil")
	}
}

func TestBuildInsertParameters(t *testing.T) {
	columns, placeholders, values := buildInsertParameters(map[string]interface{}{
		"message": "hello",
		"count":   2,
	})

	if len(columns) != 2 || len(placeholders) != 2 || len(values) != 2 {
		t.Fatalf("lens = (%d, %d, %d), want 2 each", len(columns), len(placeholders), len(values))
	}

	sort.Strings(columns)
	sort.Strings(placeholders)

	if !bytes.Equal([]byte(strings.Join(columns, ",")), []byte(`"count","message"`)) {
		t.Fatalf("columns = %#v, want quoted column names", columns)
	}
	if !bytes.Equal([]byte(strings.Join(placeholders, ",")), []byte("$1,$2")) {
		t.Fatalf("placeholders = %#v, want $1,$2", placeholders)
	}
}
