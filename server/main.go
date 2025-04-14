package main

import (
	"log"
	"net"
	"net/http"
	"server/database"
	"server/proxy"
	"server/website"
	"server/website/payment"
)

func main() {
	database.InitRedis()

	http.HandleFunc("/ws", proxy.WSHandler)
	http.HandleFunc("/stats", website.StatsHandler)
	payment.Init()

	go http.ListenAndServe(":8080", nil)

	listener, err := net.Listen("tcp", ":1080")
	if err != nil {
		log.Fatal(err)
	}
	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Println(err)
			continue
		}
		go proxy.HandleSocksConn(conn)
	}
}
