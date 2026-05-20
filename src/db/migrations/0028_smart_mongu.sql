ALTER TABLE "match_player_stats" DROP CONSTRAINT "match_player_stats_player_registration_id_player_registrations_id_fk";
--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_player_registration_id_inscriptions_id_fk" FOREIGN KEY ("player_registration_id") REFERENCES "public"."inscriptions"("id") ON DELETE cascade ON UPDATE no action;