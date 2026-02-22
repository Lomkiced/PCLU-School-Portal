.PHONY: dev db-migrate db-seed db-studio

dev:
	docker-compose up -d
	pnpm install
	pnpm turbo run dev

db-migrate:
	pnpm --filter database migrate

db-seed:
	pnpm --filter database seed

db-studio:
	pnpm --filter database studio
