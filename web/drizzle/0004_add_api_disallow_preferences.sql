ALTER TABLE `user_preferences` ADD `apiDisallowPhoto` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `apiDisallowGender` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `apiDisallowBirthday` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `apiDisallowAddress` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `apiDisallowCompany` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `apiDisallowTitle` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `apiDisallowRelated` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `user_preferences` ADD `apiDisallowNickname` integer DEFAULT 0 NOT NULL;
