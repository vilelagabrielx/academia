import psycopg

uri = "postgresql://postgres.gpsgiwfmvtkwvvxwcpnl:Caraderato%40123@aws-0-us-east-2.pooler.supabase.com:6543/postgres"

print("Adding photo_base64 column to core_userprofile...")
with psycopg.connect(uri) as conn:
    with conn.cursor() as cur:
        # Verifica se a coluna ja existe
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='core_userprofile' and column_name='photo_base64';")
        if not cur.fetchone():
            cur.execute("ALTER TABLE core_userprofile ADD COLUMN photo_base64 TEXT NULL;")
            # Adiciona a migration na tabela django_migrations para o Django saber que foi aplicada
            cur.execute("INSERT INTO django_migrations (app, name, applied) VALUES ('core', '0030_userprofile_photo_base64', NOW());")
            conn.commit()
            print("Coluna e migration adicionadas com sucesso!")
        else:
            print("Coluna ja existe.")
