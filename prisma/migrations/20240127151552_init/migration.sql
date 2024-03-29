-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `emailAddress` VARCHAR(50) NOT NULL,
    `hashedPassword` VARCHAR(1000) NOT NULL DEFAULT '',
    `fullName` VARCHAR(100) NOT NULL,
    `kind` VARCHAR(20) NOT NULL,
    `deactivated` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `User_emailAddress_key`(`emailAddress`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lender` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,
    `logo` VARCHAR(500) NOT NULL,
    `logoPublicId` VARCHAR(191) NULL,
    `logoWidth` INTEGER NULL,
    `logoHeight` INTEGER NULL,
    `minTenure` INTEGER NOT NULL,
    `maxTenure` INTEGER NOT NULL,
    `minAmount` DECIMAL(19, 2) NOT NULL,
    `maxAmount` DECIMAL(19, 2) NOT NULL,
    `monthlyInterest` DECIMAL(19, 2) NOT NULL,
    `adminFee` DECIMAL(19, 2) NOT NULL,
    `applicationFee` DECIMAL(19, 2) NOT NULL,
    `paid` BOOLEAN NOT NULL DEFAULT false,
    `deactivated` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Application` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deactivated` BOOLEAN NOT NULL DEFAULT false,
    `applicantId` INTEGER NOT NULL,
    `state` VARCHAR(20) NOT NULL,
    `moreDetail` VARCHAR(800) NOT NULL,
    `bank` VARCHAR(100) NOT NULL,
    `bankBranch` VARCHAR(200) NOT NULL,
    `accNumber` VARCHAR(20) NOT NULL,
    `accName` VARCHAR(200) NOT NULL,
    `loanPurpose` VARCHAR(300) NOT NULL,
    `amtRequired` DECIMAL(19, 2) NOT NULL,
    `repaymentPeriod` INTEGER NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `fullName` VARCHAR(100) NOT NULL,
    `DOB` DATETIME(3) NOT NULL,
    `nationalID` VARCHAR(20) NOT NULL,
    `phoneNumber` VARCHAR(20) NOT NULL,
    `resAddress` VARCHAR(300) NOT NULL,
    `natureOfRes` VARCHAR(50) NOT NULL,
    `fullMaidenNames` VARCHAR(100) NULL,
    `fullNameOfSpouse` VARCHAR(100) NULL,
    `maritalStatus` VARCHAR(20) NOT NULL,
    `profession` VARCHAR(100) NOT NULL,
    `employer` VARCHAR(100) NOT NULL,
    `employedSince` DATETIME(3) NOT NULL,
    `grossIncome` DECIMAL(19, 2) NOT NULL,
    `netIncome` DECIMAL(19, 2) NOT NULL,
    `firstNokFullName` VARCHAR(100) NOT NULL,
    `firstNokRelationship` VARCHAR(100) NOT NULL,
    `firstNokEmployer` VARCHAR(100) NOT NULL,
    `firstNokResAddress` VARCHAR(200) NOT NULL,
    `firstNokPhoneNumber` VARCHAR(20) NOT NULL,
    `secondNokFullName` VARCHAR(100) NOT NULL,
    `secondNokRelationship` VARCHAR(100) NOT NULL,
    `secondNokEmployer` VARCHAR(100) NOT NULL,
    `secondNokResAddress` VARCHAR(200) NOT NULL,
    `secondNokPhoneNumber` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PriorLoan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `applicationId` INTEGER NOT NULL,
    `lender` VARCHAR(100) NOT NULL,
    `expiryDate` DATETIME(3) NOT NULL,
    `amount` DECIMAL(19, 2) NOT NULL,
    `monthlyRepayment` DECIMAL(19, 2) NOT NULL,
    `balance` DECIMAL(19, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `KycDoc` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `applicationId` INTEGER NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Channel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `applicationId` INTEGER NOT NULL,
    `lenderId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Decision` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `channelId` INTEGER NOT NULL,
    `decision` VARCHAR(40) NOT NULL,
    `comment` VARCHAR(800) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmploymentType` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `employmentType` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmploymentPreference` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lenderId` INTEGER NOT NULL,
    `employmentTypeId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Lender` ADD CONSTRAINT `Lender_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_applicantId_fkey` FOREIGN KEY (`applicantId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PriorLoan` ADD CONSTRAINT `PriorLoan_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KycDoc` ADD CONSTRAINT `KycDoc_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `Application`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_lenderId_fkey` FOREIGN KEY (`lenderId`) REFERENCES `Lender`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Decision` ADD CONSTRAINT `Decision_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmploymentPreference` ADD CONSTRAINT `EmploymentPreference_lenderId_fkey` FOREIGN KEY (`lenderId`) REFERENCES `Lender`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EmploymentPreference` ADD CONSTRAINT `EmploymentPreference_employmentTypeId_fkey` FOREIGN KEY (`employmentTypeId`) REFERENCES `EmploymentType`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
