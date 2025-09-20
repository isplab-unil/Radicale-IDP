CREATE TABLE `user_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`disallowPhoto` integer DEFAULT 0 NOT NULL,
	`disallowGender` integer DEFAULT 0 NOT NULL,
	`disallowBirthday` integer DEFAULT 0 NOT NULL,
	`disallowAddress` integer DEFAULT 0 NOT NULL,
	`disallowCompany` integer DEFAULT 0 NOT NULL,
	`disallowTitle` integer DEFAULT 0 NOT NULL,
	`contactProviderSynced` integer DEFAULT 0 NOT NULL,
	`createdAt` text DEFAULT (datetime('now')) NOT NULL,
	`updatedAt` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
