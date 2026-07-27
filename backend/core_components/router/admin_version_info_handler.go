// admin_version_info_handler.go
// Serves the running product and database versions to authorized administrators.
// Bridges the existing readiness snapshot with the filterbar's admin-only version indicator.
// Exists so the UI does not rely on a cosmetically hidden public endpoint for role-gated details.
package router

import (
	"net/http"

	"easelect/backend/core_components/httpresponse"
)

type adminVersionInfoResponse struct {
	ProductName       string `json:"product_name"`
	AppVersion        string `json:"app_version"`
	DBVersion         string `json:"db_version"`
	RequiredDBVersion string `json:"required_db_version"`
	DBCompatible      bool   `json:"db_compatible"`
}

func adminVersionInfoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		httpresponse.RespondWithError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	readiness := systemReadinessProbe()
	httpresponse.RespondWithJSON(w, http.StatusOK, adminVersionInfoResponse{
		ProductName:       readiness.ProductName,
		AppVersion:        readiness.AppVersion,
		DBVersion:         readiness.DBVersion,
		RequiredDBVersion: readiness.RequiredDBVersion,
		DBCompatible:      readiness.DBCompatible,
	})
}
