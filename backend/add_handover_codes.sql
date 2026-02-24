-- Migration: Add handover codes to conversations table
ALTER TABLE conversations 
ADD COLUMN claimer_code VARCHAR(4) DEFAULT NULL,
ADD COLUMN finder_code VARCHAR(4) DEFAULT NULL;
