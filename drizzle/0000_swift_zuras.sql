CREATE TABLE "blogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(300) NOT NULL,
	"author" varchar(200) NOT NULL,
	"url" varchar(2000) NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "likes_nonnegative" CHECK ("blogs"."likes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "reading_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"blog_id" integer NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	CONSTRAINT "reading_list_user_blog_unique" UNIQUE("user_id","blog_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"password_hash" varchar(100) NOT NULL,
	"token" varchar(100),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_list" ADD CONSTRAINT "reading_list_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_list" ADD CONSTRAINT "reading_list_blog_id_blogs_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;