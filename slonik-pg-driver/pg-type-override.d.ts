import type pg from 'pg'

declare module "pg" {
    interface Client {
        readonly connection: pg.Connection;
    }
}
