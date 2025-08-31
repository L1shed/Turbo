package payment

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/binary"
	"log"
	"math/big"
	mathrand "math/rand"
	"server/database"
)

var (
	adjectives = []string{
		"Able", "Acidic", "Acute", "Admired", "Aged", "Agile", "Alert", "Alien",
		"Alpha", "Altruistic", "Amazing", "Amber", "Ancient", "Angelic", "Angry", "Apex",
		"Aqua", "Arcane", "Arctic", "Argent", "Arid", "Armored", "Ash", "Astral",
		"Atomic", "August", "Autumn", "Azure", "Bad", "Bald", "Basic", "Battle",
		"Beta", "Big", "Bitter", "Black", "Blank", "Blazing", "Bleak", "Blind",
		"Blonde", "Blood", "Blue", "Bold", "Bone", "Boreal", "Bound", "Brave",
		"Brazen", "Brief", "Bright", "Brilliant", "Bronze", "Brown", "Brutal", "Burning",
		"Calculating", "Calm", "Candid", "Careful", "Carrion", "Casual", "Caustic", "Cautious",
		"Celestial", "Cerulean", "Chaos", "Chaotic", "Charging", "Charmed", "Chill", "Chilling",
		"Chrome", "Chronic", "Chrono", "Cinder", "Circuit", "Civic", "Civil", "Classic",
		"Clean", "Clear", "Clever", "Clockwork", "Cloud", "Cloudy", "Cobalt", "Cold",
		"Color", "Combat", "Comfort", "Common", "Complex", "Concrete", "Constant", "Cool",
		"Copper", "Coral", "Core", "Corp", "Cosmic", "Covert", "Cozy", "Crafty",
		"Crazy", "Crimson", "Critical", "Crooked", "Cross", "Crow", "Cruel", "Crushing",
		"Cryptic", "Crystal", "Cultured", "Curious", "Cyber", "Cynical", "Daemon", "Daily",
		"Dancing", "Danger", "Dapper", "Daring", "Dark", "Dashing", "Dauntless", "Dawn",
		"Dead", "Deadly", "Deep", "Defiant", "Delta", "Desert", "Deviant", "Devoid",
		"Devoted", "Devout", "Diamond", "Digital", "Diligent", "Dire", "Dirty", "Distant",
		"Divine", "Docile", "Doom", "Double", "Draco", "Draconic", "Dream", "Dreaming",
		"Drifting", "Dry", "Dual", "Dust", "Dusty", "Dynamic", "Eager", "Early",
		"Earth", "Earthy", "Eastern", "Easy", "Ebony", "Echo", "Ecstatic", "Edge",
		"Elder", "Electric", "Elegant", "Elemental", "Elite", "Emerald", "Empty", "Enchanted",
		"Endless", "Enigma", "Epic", "Equal", "Errant", "Eternal", "Ethereal", "Even",
		"Ever", "Evil", "Exact", "Exalted", "Exotic", "Expert", "Fading", "Faint",
		"Fair", "Faithful", "Fake", "Falling", "False", "Famous", "Fancy", "Far",
		"Fast", "Fatal", "Fated", "Fearless", "Feral", "Fey", "Fiery", "Fifth",
		"Final", "Fine", "Firm", "First", "Flawless", "Fleet", "Flesh", "Floating",
		"Fluid", "Flux", "Flying", "Fog", "Forbidden", "Forest", "Forge", "Forged",
		"Forgotten", "Formal", "Forth", "Fortunate", "Foul", "Found", "Fourth", "Fractal",
		"Fragrant", "Frank", "Free", "Fresh", "Friendly", "Frigid", "Frost", "Frozen",
		"Full", "Fun", "Furious", "Future", "Fuzzy", "Gala", "Gamma", "Garnet",
		"Gaunt", "Gentle", "Genuine", "Ghost", "Ghostly", "Giant", "Giga", "Gilded",
		"Glacial", "Glad", "Glass", "Gleaming", "Glimmer", "Glitch", "Global", "Gloomy",
		"Glorious", "Glossy", "Glowing", "Gold", "Golden", "Good", "Gothic", "Graceful",
		"Grand", "Graphite", "Grave", "Gray", "Great", "Greedy", "Green", "Grim",
		"Grizzled", "Grotto", "Grounded", "Growing", "Grumpy", "Guard", "Guarded", "Guiding",
		"Gun", "Hallowed", "Hard", "Harsh", "Hasty", "Haunted", "Hazard", "Hazy",
		"Head", "Heart", "Hearth", "Heavy", "Hectic", "Heli", "Hero", "Hidden",
		"High", "Hollow", "Holy", "Home", "Honest", "Honey", "Honor", "Hopeful",
		"Horned", "Horrid", "Hostile", "Hot", "Huge", "Humble", "Hushed", "Hyper",
		"Ice", "Icy", "Ideal", "Idle", "Ignited", "Ignoble", "Ill", "Immoral",
		"Immortal", "Imperial", "Incarnate", "Indigo", "Infernal", "Infinite", "Infra", "Inner",
		"Innocent", "Iron", "Jade", "Jagged", "Jasper", "Jolly", "Jovial", "Joyful",
		"Judged", "Just", "Keen", "Kind", "Kinetic", "King", "Knowing", "Known",
	}
	nouns = []string{
		"Abyss", "Acolyte", "Aegis", "Aer", "Aether", "Agent", "Air", "Albatross",
		"Alchemist", "Alloy", "Alpha", "Alto", "Amulet", "Anchor", "Angel", "Anomaly",
		"Anvil", "Apex", "Apple", "Apprentice", "Arbiter", "Arc", "Arcana", "Arch",
		"Archer", "Archive", "Argent", "Ark", "Armada", "Armor", "Arrow", "Artificer",
		"Ash", "Ashes", "Aspect", "Assassin", "Astral", "Atom", "Augur", "Aura",
		"Aurora", "Autumn", "Avatar", "Axe", "Axis", "Azimuth", "Azure", "Babel",
		"Badger", "Bane", "Banner", "Banshee", "Bard", "Bargain", "Basilisk", "Bastion",
		"Bat", "Battle", "Beacon", "Bear", "Beast", "Bedrock", "Behemoth", "Bell",
		"Berserker", "Beta", "Blade", "Blaze", "Blight", "Blitz", "Blizzard", "Blood",
		"Bloom", "Bolt", "Bomb", "Bone", "Bonsai", "Book", "Boom", "Boulder",
		"Boundary", "Bow", "Branch", "Brand", "Breach", "Breaker", "Breath", "Breeze",
		"Brick", "Bridge", "Brigade", "Broker", "Bronze", "Brood", "Brother", "Buckler",
		"Buffalo", "Bug", "Bull", "Bullet", "Bunker", "Burst", "Byte", "Cable",
		"Cactus", "Cadet", "Cage", "Caldera", "Call", "Camel", "Candle", "Cannon",
		"Canyon", "Cape", "Captain", "Carbon", "Cardinal", "Cascade", "Castle", "Catalyst",
		"Cauldron", "Cave", "Cell", "Censor", "Centaur", "Center", "Centurion", "Cerberus",
		"Chain", "Chalice", "Chamber", "Champion", "Chance", "Channel", "Chaos", "Chapel",
		"Charm", "Charter", "Chasm", "Chest", "Chief", "Child", "Chimera", "Chip",
		"Choir", "Chrono", "Cinder", "Cipher", "Circle", "Circuit", "Citadel", "Citizen",
		"Claw", "Clay", "Cloak", "Clock", "Cloud", "Club", "Coal", "Coast",
		"Cobra", "Cobweb", "Code", "Codex", "Coil", "Coin", "Cold", "Collar",
		"Colony", "Color", "Comet", "Commander", "Compass", "Complex", "Conduit", "Cone",
		"Conjurer", "Consul", "Contract", "Control", "Copper", "Core", "Corpse", "Corridor",
		"Corsair", "Cosmos", "Council", "Coyote", "Crab", "Craft", "Crane", "Crater",
		"Crawler", "Creek", "Crescent", "Crest", "Crew", "Cricket", "Crocodile", "Cross",
		"Crow", "Crown", "Crucible", "Crusader", "Crush", "Crust", "Cry", "Crypt",
		"Crystal", "Cube", "Cult", "Cup", "Curator", "Curse", "Current", "Cutlass",
		"Cycle", "Cyclone", "Cyclops", "Cylinder", "Daemon", "Dagger", "Data", "Dawn",
		"Day", "Deacon", "Deal", "Death", "Debt", "Decay", "Deck", "Decree",
		"Deer", "Delta", "Demon", "Den", "Depth", "Deputy", "Desert", "Design",
		"Desire", "Despair", "Destiny", "Device", "Devil", "Dew", "Diamond", "Dice",
		"Digit", "Diode", "Dire", "Disc", "Ditch", "Diver", "Doctor", "Doctrine",
		"Dog", "Dojo", "Dolphin", "Domain", "Dome", "Dominion", "Donkey", "Doom",
		"Door", "Dove", "Draco", "Dragon", "Drake", "Dread", "Dream", "Drifter",
		"Drill", "Drone", "Drop", "Druid", "Drum", "Dryad", "Duck", "Duel",
		"Duke", "Dune", "Dungeon", "Dusk", "Dust", "Duty", "Dwarf", "Eagle",
		"Earth", "Echo", "Eclipse", "Eddy", "Edge", "Edict", "Eel", "Effigy",
		"Egg", "Elder", "Element", "Elephant", "Elf", "Elixir", "Ember", "Emblem",
		"Emerald", "Emissary", "Emperor", "Empire", "Enchanter", "End", "Enforcer", "Engine",
		"Enigma", "Envoy", "Eon", "Epoch", "Epsilon", "Era", "Error", "Essence",
		"Etch", "Ether", "Exarch", "Exile", "Exodus", "Eye", "Fable", "Face",
		"Factor", "Factory", "Fairy", "Faith", "Falcon", "Fall", "Fang", "Farm",
		"Fate", "Father", "Fault", "Fauna", "Fear", "Feast", "Feather", "Feline",
	}
)

func Pay(id string, amount float64) {
	state := GetState(id)
	username, password := generateCredentials(state.Address)

	UpdateState(id, func(state *State) {
		state.AmountReceived = amount
		if state.AmountReceived >= state.Amount {
			state.Status = "paid"
			state.Username, state.Password = username, password
		}
	})

	err := database.RegisterUser(password, int(state.GB*1000))
	if err != nil {
		log.Printf("Failed to register user %s: %v", username, err)
		return
	}

}

// GenerateCredentials creates a username-password pair based on a cryptocurrency address
func generateCredentials(address string) (string, string) {
	username := "turbo_" + generateNameFromAddress(address)
	password := generatePassword(20)

	return username, password
}

// generateNameFromAddress creates a deterministic adjective-noun combination from an address
func generateNameFromAddress(address string) string {
	// Hash the address to get consistent output
	hash := sha256.Sum256([]byte(address))

	// Use first 8 bytes of hash as an uint64 to seed the random generator
	seed := binary.BigEndian.Uint64(hash[:8])
	r := mathrand.New(mathrand.NewSource(int64(seed)))

	// Pick adjective and noun deterministically
	adj := adjectives[r.Intn(len(adjectives))]
	noun := nouns[r.Intn(len(nouns))]

	return adj + noun
}

func generatePassword(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	password := make([]byte, length)
	for i := range password {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		password[i] = charset[num.Int64()]
	}
	return string(password)
}
