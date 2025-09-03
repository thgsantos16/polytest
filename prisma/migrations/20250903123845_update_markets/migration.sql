-- CreateTable
CREATE TABLE "markets" (
    "id" TEXT NOT NULL,
    "polymarketId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "description" TEXT,
    "endDate" TIMESTAMP(3) NOT NULL,
    "volume24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "liquidity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "yesPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "noPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "priceChange24h" DOUBLE PRECISION,
    "yesTokenId" TEXT NOT NULL,
    "noTokenId" TEXT NOT NULL,
    "conditionId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "markets_polymarketId_key" ON "markets"("polymarketId");

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
