-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'SYSTEM',
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "distanceUnit" TEXT NOT NULL DEFAULT 'MI',
    "volumeUnit" TEXT NOT NULL DEFAULT 'GAL',
    "economyUnit" TEXT NOT NULL DEFAULT 'MPG',
    "dateFormat" TEXT NOT NULL DEFAULT 'MMM d, yyyy',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "vin" TEXT,
    "licensePlate" TEXT,
    "purchaseDate" DATETIME,
    "purchaseMileage" INTEGER,
    "currentMileage" INTEGER,
    "purchasePriceCents" BIGINT,
    "engine" TEXT,
    "drivetrain" TEXT,
    "transmission" TEXT,
    "fuelType" TEXT,
    "exteriorColor" TEXT,
    "notes" TEXT,
    "imagePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "odometer" INTEGER NOT NULL,
    "volume" DECIMAL NOT NULL,
    "pricePerUnit" DECIMAL NOT NULL,
    "totalCostCents" BIGINT NOT NULL,
    "station" TEXT,
    "fuelGrade" TEXT,
    "isFullTank" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "calculatedDistance" INTEGER,
    "calculatedEconomy" DECIMAL,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FuelEntry_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "maintenanceTypeId" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "odometer" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "provider" TEXT,
    "laborCostCents" BIGINT NOT NULL DEFAULT 0,
    "partsCostCents" BIGINT NOT NULL DEFAULT 0,
    "feesCostCents" BIGINT NOT NULL DEFAULT 0,
    "totalCostCents" BIGINT NOT NULL,
    "notes" TEXT,
    "isWarranty" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MaintenanceRecord_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MaintenanceRecord_maintenanceTypeId_fkey" FOREIGN KEY ("maintenanceTypeId") REFERENCES "MaintenanceType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaintenanceMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "maintenanceRecordId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "positionLabel" TEXT,
    "unit" TEXT,
    "valueType" TEXT NOT NULL DEFAULT 'DECIMAL',
    "decimalValue" DECIMAL,
    "textValue" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaintenanceMeasurement_maintenanceRecordId_fkey" FOREIGN KEY ("maintenanceRecordId") REFERENCES "MaintenanceRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "maintenanceTypeId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "intervalDistance" INTEGER,
    "intervalMonths" INTEGER,
    "warnDistanceBefore" INTEGER,
    "warnDaysBefore" INTEGER,
    "lastCompletedAt" DATETIME,
    "lastCompletedOdometer" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reminder_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reminder_maintenanceTypeId_fkey" FOREIGN KEY ("maintenanceTypeId") REFERENCES "MaintenanceType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "amountCents" BIGINT NOT NULL,
    "merchant" TEXT,
    "category" TEXT NOT NULL,
    "odometer" INTEGER,
    "notes" TEXT,
    "receiptPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "odometer" INTEGER,
    "title" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "linkedMaintenanceRecordId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VehicleNote_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VehicleNote_linkedMaintenanceRecordId_fkey" FOREIGN KEY ("linkedMaintenanceRecordId") REFERENCES "MaintenanceRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "maintenanceRecordId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "occurredAt" DATETIME,
    "odometer" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_maintenanceRecordId_fkey" FOREIGN KEY ("maintenanceRecordId") REFERENCES "MaintenanceRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OdometerReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "reading" INTEGER NOT NULL,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OdometerReading_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "fuelEntryId" TEXT,
    "maintenanceRecordId" TEXT,
    "expenseId" TEXT,
    "documentId" TEXT,
    "vehicleNoteId" TEXT,
    "odometerReadingId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimelineEvent_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimelineEvent_fuelEntryId_fkey" FOREIGN KEY ("fuelEntryId") REFERENCES "FuelEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimelineEvent_maintenanceRecordId_fkey" FOREIGN KEY ("maintenanceRecordId") REFERENCES "MaintenanceRecord" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimelineEvent_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimelineEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimelineEvent_vehicleNoteId_fkey" FOREIGN KEY ("vehicleNoteId") REFERENCES "VehicleNote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimelineEvent_odometerReadingId_fkey" FOREIGN KEY ("odometerReadingId") REFERENCES "OdometerReading" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImportSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sourceFilename" TEXT NOT NULL,
    "columnMapping" JSONB,
    "previewRows" JSONB,
    "validationLog" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImportSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ImportSession_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "Vehicle_userId_createdAt_idx" ON "Vehicle"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_userId_vin_key" ON "Vehicle"("userId", "vin");

-- CreateIndex
CREATE INDEX "FuelEntry_vehicleId_occurredAt_idx" ON "FuelEntry"("vehicleId", "occurredAt");

-- CreateIndex
CREATE INDEX "FuelEntry_vehicleId_odometer_idx" ON "FuelEntry"("vehicleId", "odometer");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceType_userId_name_key" ON "MaintenanceType"("userId", "name");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_vehicleId_occurredAt_idx" ON "MaintenanceRecord"("vehicleId", "occurredAt");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_vehicleId_odometer_idx" ON "MaintenanceRecord"("vehicleId", "odometer");

-- CreateIndex
CREATE INDEX "MaintenanceMeasurement_maintenanceRecordId_label_idx" ON "MaintenanceMeasurement"("maintenanceRecordId", "label");

-- CreateIndex
CREATE INDEX "Reminder_userId_vehicleId_status_idx" ON "Reminder"("userId", "vehicleId", "status");

-- CreateIndex
CREATE INDEX "Expense_vehicleId_occurredAt_idx" ON "Expense"("vehicleId", "occurredAt");

-- CreateIndex
CREATE INDEX "VehicleNote_vehicleId_occurredAt_idx" ON "VehicleNote"("vehicleId", "occurredAt");

-- CreateIndex
CREATE INDEX "Document_vehicleId_createdAt_idx" ON "Document"("vehicleId", "createdAt");

-- CreateIndex
CREATE INDEX "OdometerReading_vehicleId_occurredAt_idx" ON "OdometerReading"("vehicleId", "occurredAt");

-- CreateIndex
CREATE INDEX "OdometerReading_vehicleId_reading_idx" ON "OdometerReading"("vehicleId", "reading");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_fuelEntryId_key" ON "TimelineEvent"("fuelEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_maintenanceRecordId_key" ON "TimelineEvent"("maintenanceRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_expenseId_key" ON "TimelineEvent"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_documentId_key" ON "TimelineEvent"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_vehicleNoteId_key" ON "TimelineEvent"("vehicleNoteId");

-- CreateIndex
CREATE UNIQUE INDEX "TimelineEvent_odometerReadingId_key" ON "TimelineEvent"("odometerReadingId");

-- CreateIndex
CREATE INDEX "TimelineEvent_vehicleId_occurredAt_idx" ON "TimelineEvent"("vehicleId", "occurredAt");
