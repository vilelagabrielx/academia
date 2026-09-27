import psycopg

uri = "postgresql://postgres.gpsgiwfmvtkwvvxwcpnl:Caraderato%40123@aws-0-us-east-2.pooler.supabase.com:6543/postgres"

print("Adding whatsapp column to core_userprofile...")
with psycopg.connect(uri) as conn:
    with conn.cursor() as cur:
        # Verifica se a coluna ja existe
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='core_userprofile' and column_name='whatsapp';")
        if not cur.fetchone():
            cur.execute("ALTER TABLE core_userprofile ADD COLUMN whatsapp VARCHAR(20) NULL;")
            conn.commit()
            print("Coluna adicionada com sucesso!")
        else:
            print("Coluna ja existe.")
