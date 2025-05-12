-- Make password column nullable
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL; 