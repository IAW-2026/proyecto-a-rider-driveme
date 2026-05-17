-- Add publicId column to Pasajero
ALTER TABLE "Pasajero" ADD COLUMN "publicId" TEXT;

-- Create unique index for publicId
CREATE UNIQUE INDEX "Pasajero_publicId_idx" ON "Pasajero"("publicId");
