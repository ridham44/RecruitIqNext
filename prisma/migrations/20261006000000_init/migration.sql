-- RecruitIQ database schema — single baseline migration, generated from
-- prisma/schema.prisma (replaces the earlier step-by-step migration history).

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'COMPANY', 'CANDIDATE', 'RECRUITER', 'INTERVIEWER', 'CLIENT_HR');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'SCREENING', 'SHORTLISTED', 'REJECTED', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'QUALIFIED', 'NOT_QUALIFIED', 'SUBMITTED_TO_CLIENT');

-- CreateEnum
CREATE TYPE "ScreeningStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "AcademicStatus" AS ENUM ('ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InterviewSlotStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InterviewStage" AS ENUM ('NOT_STARTED', 'INTRODUCTION', 'RESUME_QUESTIONS', 'BASIC_TECHNICAL', 'JOB_SPECIFIC', 'SCENARIO', 'BEHAVIORAL', 'CANDIDATE_QUESTIONS', 'END');

-- CreateEnum
CREATE TYPE "InterviewQuestionType" AS ENUM ('INTRODUCTION', 'CUSTOM', 'RESUME_BASED', 'TECHNICAL', 'JOB_SPECIFIC', 'SCENARIO', 'FOLLOW_UP', 'BEHAVIORAL', 'CANDIDATE_QUESTION');

-- CreateEnum
CREATE TYPE "InterviewEventType" AS ENUM ('CAMERA_ON', 'CAMERA_OFF', 'MIC_ON', 'MIC_OFF', 'TAB_SWITCH', 'PAGE_LEFT', 'FULLSCREEN_EXIT', 'CONNECTION_LOST', 'CONNECTION_RESTORED', 'INTERVIEW_STARTED', 'INTERVIEW_ENDED');

-- CreateEnum
CREATE TYPE "InterviewReportStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "InterviewQuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "AiVoiceGender" AS ENUM ('FEMALE', 'MALE', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "DifficultyStrategy" AS ENUM ('FIXED', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('APPLICATION_SHORTLISTED', 'APPLICATION_REJECTED', 'INTERVIEW_CONFIRMATION', 'ACCOUNT_SETUP', 'INTERVIEW_INVITE', 'CLIENT_SUBMISSION', 'SECOND_ROUND_REQUESTED', 'OTP_VERIFICATION');

-- CreateEnum
CREATE TYPE "InterviewFlow" AS ENUM ('SLOT', 'INSTANT');

-- CreateEnum
CREATE TYPE "ApplicationSource" AS ENUM ('DIRECT', 'GUEST', 'AUTO_MATCH', 'RECQ');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'RECRUITER');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "passwordSet" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_members" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'RECRUITER',
    "fullName" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_companies" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "clientCompanyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hiring_persons" (
    "id" TEXT NOT NULL,
    "clientCompanyId" TEXT NOT NULL,
    "departmentId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "designation" TEXT,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hiring_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_submissions" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "clientCompanyId" TEXT,
    "departmentId" TEXT,
    "hiringPersonId" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "note" TEXT,
    "snapshot" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "viewedAt" TIMESTAMP(3),
    "accessTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_recruiters" (
    "clientCompanyId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_recruiters_pkey" PRIMARY KEY ("clientCompanyId","memberId")
);

-- CreateTable
CREATE TABLE "job_recruiters" (
    "jobId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_recruiters_pkey" PRIMARY KEY ("jobId","memberId")
);

-- CreateTable
CREATE TABLE "password_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'INVITE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "location" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByAdminId" TEXT,
    "slug" TEXT,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "location" TEXT,
    "headline" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gender" "Gender",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phoneVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "educations" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "institution" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "isCurrentlyStudying" BOOLEAN NOT NULL DEFAULT false,
    "grade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minimumExperience" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maximumExperience" DOUBLE PRECISION,
    "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "educationRequirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "location" TEXT,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "workMode" TEXT NOT NULL DEFAULT 'On-site',
    "openings" INTEGER NOT NULL DEFAULT 1,
    "jobLevel" TEXT NOT NULL DEFAULT 'Mid',
    "noticePeriod" TEXT,
    "languagesRequired" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "salaryRange" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "slug" TEXT,
    "structuredRequirements" JSONB,
    "minAcceptableScore" DOUBLE PRECISION NOT NULL DEFAULT 75,
    "autoRejectBelowMinScore" BOOLEAN NOT NULL DEFAULT false,
    "autoAdvanceOnMatch" BOOLEAN NOT NULL DEFAULT false,
    "interviewFlow" "InterviewFlow" NOT NULL DEFAULT 'SLOT',
    "inviteValidDays" INTEGER NOT NULL DEFAULT 7,
    "interviewAvailabilityStart" TIMESTAMP(3),
    "interviewAvailabilityEnd" TIMESTAMP(3),
    "finalThreshold" DOUBLE PRECISION,
    "cvWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "interviewWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "autoSubmitToClient" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientCompanyId" TEXT,
    "departmentId" TEXT,
    "hiringPersonId" TEXT,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT,
    "rawText" TEXT,
    "parsedData" JSONB,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_otps" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'APPLY',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'RECQ_APPLY',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_uploads" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "rawText" TEXT,
    "parsedData" JSONB,
    "recqMatches" JSONB,
    "consumedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_submissions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "matchResults" JSONB,
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_blobs" (
    "id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_blobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "source" "ApplicationSource" NOT NULL DEFAULT 'DIRECT',
    "finalScore" DOUBLE PRECISION,
    "finalScoredAt" TIMESTAMP(3),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screening_results" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "ScreeningStatus" NOT NULL DEFAULT 'PENDING',
    "overallScore" DOUBLE PRECISION,
    "skillMatchScore" DOUBLE PRECISION,
    "experienceMatchScore" DOUBLE PRECISION,
    "educationMatchScore" DOUBLE PRECISION,
    "matchedSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "missingSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "concerns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reasoning" TEXT,
    "deterministicChecks" JSONB,
    "aiModel" TEXT,
    "errorMessage" TEXT,
    "screenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "screening_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_slots" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "InterviewSlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "slotId" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "stage" "InterviewStage" NOT NULL DEFAULT 'NOT_STARTED',
    "liveKitRoomName" TEXT,
    "plannedQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "accessTokenHash" TEXT,
    "inviteNonce" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "inviteSentAt" TIMESTAMP(3),
    "inviteSendCount" INTEGER NOT NULL DEFAULT 0,
    "inviteSendWindowAt" TIMESTAMP(3),
    "round" INTEGER NOT NULL DEFAULT 1,
    "roundReason" TEXT,
    "roundNotes" TEXT,
    "roundRequestedById" TEXT,
    "roundRequestedByRole" TEXT,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_interview_configs" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "aiName" TEXT NOT NULL DEFAULT 'Priya',
    "aiTitle" TEXT NOT NULL DEFAULT 'Virtual HR',
    "questionCount" INTEGER NOT NULL DEFAULT 10,
    "answerTimeSeconds" INTEGER NOT NULL DEFAULT 30,
    "customQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "voiceGender" "AiVoiceGender" NOT NULL DEFAULT 'FEMALE',
    "ttsVoiceId" TEXT,
    "difficultyStrategy" "DifficultyStrategy" NOT NULL DEFAULT 'ADAPTIVE',
    "interviewInstructions" TEXT,
    "evaluationInstructions" TEXT,
    "focusSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_interview_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_questions" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "stage" "InterviewStage" NOT NULL,
    "type" "InterviewQuestionType" NOT NULL,
    "text" TEXT NOT NULL,
    "parentQuestionId" TEXT,
    "answerTimeLimitSeconds" INTEGER NOT NULL,
    "difficulty" "InterviewQuestionDifficulty",
    "askedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_answers" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "rawTranscript" TEXT NOT NULL DEFAULT '',
    "normalizedTranscript" TEXT NOT NULL DEFAULT '',
    "manuallyCorrected" BOOLEAN NOT NULL DEFAULT false,
    "correctedTranscript" TEXT,
    "sttConfidence" DOUBLE PRECISION,
    "durationSeconds" INTEGER,
    "timedOut" BOOLEAN NOT NULL DEFAULT false,
    "evaluation" JSONB,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_events" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "type" "InterviewEventType" NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_reports" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "status" "InterviewReportStatus" NOT NULL DEFAULT 'PENDING',
    "overallScore" DOUBLE PRECISION,
    "technicalScore" DOUBLE PRECISION,
    "communicationScore" DOUBLE PRECISION,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "areasForImprovement" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "questionAnalysis" JSONB,
    "resumeAlignment" JSONB,
    "criteriaAssessment" JSONB,
    "reasoning" TEXT,
    "aiModel" TEXT,
    "errorMessage" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT,
    "recipientEmail" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL,
    "errorMessage" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "company_members_userId_key" ON "company_members"("userId");

-- CreateIndex
CREATE INDEX "company_members_companyId_idx" ON "company_members"("companyId");

-- CreateIndex
CREATE INDEX "client_companies_companyId_idx" ON "client_companies"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_clientCompanyId_name_key" ON "departments"("clientCompanyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "hiring_persons_userId_key" ON "hiring_persons"("userId");

-- CreateIndex
CREATE INDEX "hiring_persons_departmentId_idx" ON "hiring_persons"("departmentId");

-- CreateIndex
CREATE INDEX "hiring_persons_clientCompanyId_idx" ON "hiring_persons"("clientCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "client_submissions_accessTokenHash_key" ON "client_submissions"("accessTokenHash");

-- CreateIndex
CREATE INDEX "client_submissions_applicationId_idx" ON "client_submissions"("applicationId");

-- CreateIndex
CREATE INDEX "client_submissions_hiringPersonId_idx" ON "client_submissions"("hiringPersonId");

-- CreateIndex
CREATE INDEX "client_submissions_clientCompanyId_idx" ON "client_submissions"("clientCompanyId");

-- CreateIndex
CREATE INDEX "client_recruiters_memberId_idx" ON "client_recruiters"("memberId");

-- CreateIndex
CREATE INDEX "job_recruiters_memberId_idx" ON "job_recruiters"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "password_tokens_tokenHash_key" ON "password_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_tokens_userId_idx" ON "password_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_userId_key" ON "companies"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_userId_key" ON "candidates"("userId");

-- CreateIndex
CREATE INDEX "educations_candidateId_idx" ON "educations"("candidateId");

-- CreateIndex
CREATE INDEX "jobs_companyId_idx" ON "jobs"("companyId");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_clientCompanyId_idx" ON "jobs"("clientCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_companyId_slug_key" ON "jobs"("companyId", "slug");

-- CreateIndex
CREATE INDEX "resumes_candidateId_idx" ON "resumes"("candidateId");

-- CreateIndex
CREATE INDEX "phone_otps_phone_createdAt_idx" ON "phone_otps"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "phone_otps_ip_createdAt_idx" ON "phone_otps"("ip", "createdAt");

-- CreateIndex
CREATE INDEX "email_otps_email_createdAt_idx" ON "email_otps"("email", "createdAt");

-- CreateIndex
CREATE INDEX "email_otps_ip_createdAt_idx" ON "email_otps"("ip", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cv_submissions_applicationId_key" ON "cv_submissions"("applicationId");

-- CreateIndex
CREATE INDEX "cv_submissions_companyId_idx" ON "cv_submissions"("companyId");

-- CreateIndex
CREATE INDEX "cv_submissions_candidateId_idx" ON "cv_submissions"("candidateId");

-- CreateIndex
CREATE INDEX "applications_jobId_idx" ON "applications"("jobId");

-- CreateIndex
CREATE INDEX "applications_candidateId_idx" ON "applications"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "applications_candidateId_jobId_key" ON "applications"("candidateId", "jobId");

-- CreateIndex
CREATE UNIQUE INDEX "screening_results_applicationId_key" ON "screening_results"("applicationId");

-- CreateIndex
CREATE INDEX "interview_slots_jobId_idx" ON "interview_slots"("jobId");

-- CreateIndex
CREATE INDEX "interview_slots_status_idx" ON "interview_slots"("status");

-- CreateIndex
CREATE UNIQUE INDEX "interviews_accessTokenHash_key" ON "interviews"("accessTokenHash");

-- CreateIndex
CREATE INDEX "interviews_applicationId_idx" ON "interviews"("applicationId");

-- CreateIndex
CREATE INDEX "interviews_slotId_idx" ON "interviews"("slotId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_interview_configs_jobId_key" ON "ai_interview_configs"("jobId");

-- CreateIndex
CREATE INDEX "interview_questions_interviewId_idx" ON "interview_questions"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "interview_answers_questionId_key" ON "interview_answers"("questionId");

-- CreateIndex
CREATE INDEX "interview_events_interviewId_idx" ON "interview_events"("interviewId");

-- CreateIndex
CREATE UNIQUE INDEX "interview_reports_interviewId_key" ON "interview_reports"("interviewId");

-- CreateIndex
CREATE INDEX "email_logs_applicationId_idx" ON "email_logs"("applicationId");

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_members" ADD CONSTRAINT "company_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_companies" ADD CONSTRAINT "client_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "client_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_persons" ADD CONSTRAINT "hiring_persons_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "client_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_persons" ADD CONSTRAINT "hiring_persons_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hiring_persons" ADD CONSTRAINT "hiring_persons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_submissions" ADD CONSTRAINT "client_submissions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_submissions" ADD CONSTRAINT "client_submissions_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "client_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_submissions" ADD CONSTRAINT "client_submissions_hiringPersonId_fkey" FOREIGN KEY ("hiringPersonId") REFERENCES "hiring_persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_recruiters" ADD CONSTRAINT "client_recruiters_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "client_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_recruiters" ADD CONSTRAINT "client_recruiters_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "company_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_recruiters" ADD CONSTRAINT "job_recruiters_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_recruiters" ADD CONSTRAINT "job_recruiters_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "company_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_tokens" ADD CONSTRAINT "password_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "educations" ADD CONSTRAINT "educations_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_clientCompanyId_fkey" FOREIGN KEY ("clientCompanyId") REFERENCES "client_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_hiringPersonId_fkey" FOREIGN KEY ("hiringPersonId") REFERENCES "hiring_persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_submissions" ADD CONSTRAINT "cv_submissions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_submissions" ADD CONSTRAINT "cv_submissions_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_submissions" ADD CONSTRAINT "cv_submissions_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_submissions" ADD CONSTRAINT "cv_submissions_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_results" ADD CONSTRAINT "screening_results_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_slots" ADD CONSTRAINT "interview_slots_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "interview_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_interview_configs" ADD CONSTRAINT "ai_interview_configs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_parentQuestionId_fkey" FOREIGN KEY ("parentQuestionId") REFERENCES "interview_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_answers" ADD CONSTRAINT "interview_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "interview_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_events" ADD CONSTRAINT "interview_events_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_reports" ADD CONSTRAINT "interview_reports_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

