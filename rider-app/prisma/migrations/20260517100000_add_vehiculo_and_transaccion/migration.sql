-- AlterTable
ALTER TABLE "Viaje" ADD COLUMN "idVehiculo" TEXT,
ADD COLUMN "latitudActual" DOUBLE PRECISION,
ADD COLUMN "longitudActual" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Transaccion" (
    "id" TEXT NOT NULL,
    "viajeId" TEXT NOT NULL,
    "idTransaccion" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaccion_viajeId_idx" ON "Transaccion"("viajeId");

-- AddForeignKey
ALTER TABLE "Transaccion" ADD CONSTRAINT "Transaccion_viajeId_fkey" FOREIGN KEY ("viajeId") REFERENCES "Viaje"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
