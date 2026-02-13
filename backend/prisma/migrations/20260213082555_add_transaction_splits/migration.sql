-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "is_split" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "transaction_splits" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "transaction_splits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_splits_transaction_id_idx" ON "transaction_splits"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_splits_transaction_id_category_id_key" ON "transaction_splits"("transaction_id", "category_id");

-- AddForeignKey
ALTER TABLE "transaction_splits" ADD CONSTRAINT "transaction_splits_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_splits" ADD CONSTRAINT "transaction_splits_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
