package payment

import (
	"html/template"
	"log"
	"net/http"
)

var templates = make(map[string]*template.Template)

func initTemplates(names ...string) {
	for _, name := range names {
		tmpl, err := template.ParseFiles(
			"templates/payment/layout.html",
			"templates/payment/"+name+".html",
		)
		if err != nil {
			log.Println("Template initiating error:", err)
			return
		}

		templates[name] = tmpl
	}
}

func ExecuteTemplate(w http.ResponseWriter, name string, data interface{}) {
	tmpl := templates[name]

	err := tmpl.ExecuteTemplate(w, "layout.html", data)
	if err != nil {
		http.Error(w, "Template rendering error: "+err.Error(), http.StatusInternalServerError)
	}
}
