CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"display_name" varchar(50),
	"profile_picture" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
