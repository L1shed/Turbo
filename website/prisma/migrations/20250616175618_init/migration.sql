-- CreateTable
CREATE TABLE "UserData" (
    "walletAddress" TEXT NOT NULL,
    "username" TEXT,
    "preferences" JSONB,
    "lastLogin" TIMESTAMP(3),
    "totalEarnings" DOUBLE PRECISION,
    "todayEarnings" DOUBLE PRECISION,
    "bandwidthUsed" DOUBLE PRECISION,
    "uptime" DOUBLE PRECISION,
    "requestCount" INTEGER,
    "location" TEXT,
    "isConnected" BOOLEAN,
    "earningsHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserData_pkey" PRIMARY KEY ("walletAddress")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserData_walletAddress_key" ON "UserData"("walletAddress");
