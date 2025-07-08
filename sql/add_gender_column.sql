-- Add gender column to users table
ALTER TABLE users 
ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));

-- Add comment for clarity
COMMENT ON COLUMN users.gender IS 'User gender: male, female, other, or prefer_not_to_say';
