-- CreateTable
CREATE TABLE "frameworks" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" TEXT NOT NULL,
    "version" VARCHAR(16) NOT NULL,
    "publisher" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_themes" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "control_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "controls" (
    "id" TEXT NOT NULL,
    "frameworkId" TEXT NOT NULL,
    "themeId" TEXT NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "controlTypes" TEXT[],
    "securityProperties" TEXT[],
    "cybersecurityConcepts" TEXT[],
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "controls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "frameworks_code_key" ON "frameworks"("code");

-- CreateIndex
CREATE INDEX "control_themes_frameworkId_idx" ON "control_themes"("frameworkId");

-- CreateIndex
CREATE UNIQUE INDEX "control_themes_frameworkId_code_key" ON "control_themes"("frameworkId", "code");

-- CreateIndex
CREATE INDEX "controls_themeId_idx" ON "controls"("themeId");

-- CreateIndex
CREATE INDEX "controls_frameworkId_sortOrder_idx" ON "controls"("frameworkId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "controls_frameworkId_code_key" ON "controls"("frameworkId", "code");

-- AddForeignKey
ALTER TABLE "control_themes" ADD CONSTRAINT "control_themes_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controls" ADD CONSTRAINT "controls_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "frameworks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "controls" ADD CONSTRAINT "controls_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "control_themes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
