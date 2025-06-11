package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"log"
	"math/big"
	"net"
	"net/http"
	"server/database"
	"server/proxy"
	"server/website"
	"server/website/payment"
	"time"
)

func generateTLSCert() tls.Certificate {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		log.Fatal(err)
	}

	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			Organization: []string{"Turbo Proxy Dev"},
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(time.Hour * 24 * 180), // Valid for 180 days
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		IPAddresses:           []net.IP{net.ParseIP("127.0.0.1")},
		DNSNames:              []string{"localhost"},
	}

	certDER, err := x509.CreateCertificate(rand.Reader, &template, &template, &key.PublicKey, key)
	if err != nil {
		log.Fatal(err)
	}

	cert := tls.Certificate{
		Certificate: [][]byte{certDER},
		PrivateKey:  key,
	}

	return cert
}

func main() {
	database.InitRedis()

	http.HandleFunc("/stats", website.StatsHandler)
	payment.Init()

	go http.ListenAndServe(":8080", nil)

	tlsConfig := &tls.Config{
		InsecureSkipVerify: true, // Skip verification for self-signed cert
		Certificates:       []tls.Certificate{generateTLSCert()},
		NextProtos:         []string{"turbo-proxy"}, // Application protocol
	}

	// Start QUIC server on port 8443
	err := proxy.StartQuicServer(":8443", tlsConfig)
	if err != nil {
		log.Fatal("Failed to start QUIC server:", err)
	}

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
