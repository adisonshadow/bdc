import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsActiveColumn1683337200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 检查列是否存在
        const hasColumn = await queryRunner.hasColumn('data_structures', 'is_active');
        if (!hasColumn) {
            await queryRunner.query(`
                ALTER TABLE bdc.data_structures 
                ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL
            `);
        }

        // 检查 version 列是否存在
        const hasVersionColumn = await queryRunner.hasColumn('data_structures', 'version');
        if (!hasVersionColumn) {
            await queryRunner.query(`
                ALTER TABLE bdc.data_structures 
                ADD COLUMN version INTEGER DEFAULT 1 NOT NULL
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE bdc.data_structures 
            DROP COLUMN IF EXISTS is_active,
            DROP COLUMN IF EXISTS version
        `);
    }
} 