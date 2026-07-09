import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { DatabaseModule } from './common/database/database.module';

@Module({})
class MockDatabaseModule {}

describe('AppModule', () => {
  it('compiles', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(MockDatabaseModule)
      .compile();

    expect(module).toBeDefined();
  });
});
