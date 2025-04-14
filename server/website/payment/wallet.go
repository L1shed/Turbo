package payment

import (
	"github.com/foxnut/go-hdwallet"
	"github.com/foxnut/go-hdwallet/coinname"
	"log"
	"strconv"
)

var (
	mnemonic = "jealous play theme sponsor any blue palm result board crane magic indoor"
)

func generateAddress(currency, id string) string {

	var coin hdwallet.Option
	switch currency {
	case coinname.BTC:
		coin = hdwallet.CoinType(hdwallet.BTC)
	case coinname.ETH:
		coin = hdwallet.CoinType(hdwallet.ETH)
	case coinname.USDT:
		coin = hdwallet.CoinType(hdwallet.USDT)
	case "LTC":
		coin = hdwallet.CoinType(hdwallet.LTC)
	case "BCH":
		coin = hdwallet.CoinType(hdwallet.BCH)
	case "DOGE":
		coin = hdwallet.CoinType(hdwallet.DOGE)
	case "DASH":
		coin = hdwallet.CoinType(hdwallet.DASH)
	}

	//strings.Split(id, "-") for new ID

	intID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		log.Println(err)
	}

	index := hdwallet.AddressIndex(uint32(intID))

	master, err := hdwallet.NewKey(
		hdwallet.Mnemonic(mnemonic),
	)
	if err != nil {
		panic(err)
	}

	wallet, _ := master.GetWallet(coin, index)
	address, _ := wallet.GetAddress()

	log.Println("New "+currency+" address:", address, " with ID:", intID)

	return address
}
