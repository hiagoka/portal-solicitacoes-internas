import { describe, expect, it } from 'vitest';
import { lerEnv } from '../src/config/env';

// Segredos que estão PUBLICADOS neste repositório (docker-compose.yml e .env.example): qualquer pessoa pode usá-los para
// assinar um token válido. Em produção, o backend os recusa, a menos que a pessoa autorize de forma explícita.
const SEGREDO_DO_COMPOSE = 'segredo-de-demonstracao-troque-em-producao';
const SEGREDO_DO_EXEMPLO = 'troque-por-um-segredo-longo-e-aleatorio';
const SEGREDO_PROPRIO = 'a3f9c2e17b8d4056e1f2a9b7c3d84e60f5a1b2c3d4e5f60718293a4b5c6d7e8f';

const base = { DATABASE_URL: 'postgres://u:p@localhost:5432/portal' };
const ler = (extra: Record<string, string>) => lerEnv({ ...base, ...extra });

describe('lerEnv: segredos de demonstração', () => {
  it('em desenvolvimento, o segredo de demonstração é aceito e não gera aviso (é o uso normal local)', () => {
    const r = ler({ NODE_ENV: 'development', JWT_SECRET: SEGREDO_DO_EXEMPLO });
    expect(r.valores.JWT_SECRET).toBe(SEGREDO_DO_EXEMPLO);
    expect(r.avisos).toEqual([]);
  });

  it.each([['do docker-compose', SEGREDO_DO_COMPOSE], ['do .env.example', SEGREDO_DO_EXEMPLO]])(
    'em produção, o segredo %s é RECUSADO sem autorização explícita',
    (_nome, segredo) => {
      expect(() => ler({ NODE_ENV: 'production', JWT_SECRET: segredo })).toThrowError(/JWT_SECRET.*demonstra/i);
    },
  );

  it('a mensagem de recusa diz como resolver (segredo próprio ou autorização explícita)', () => {
    expect(() => ler({ NODE_ENV: 'production', JWT_SECRET: SEGREDO_DO_COMPOSE })).toThrowError(/openssl rand/);
    expect(() => ler({ NODE_ENV: 'production', JWT_SECRET: SEGREDO_DO_COMPOSE })).toThrowError(/PERMITIR_SEGREDOS_DE_DEMONSTRACAO/);
  });

  it('com autorização explícita, aceita em produção, mas AVISA em alto e bom som', () => {
    const r = ler({ NODE_ENV: 'production', JWT_SECRET: SEGREDO_DO_COMPOSE, PERMITIR_SEGREDOS_DE_DEMONSTRACAO: 'true' });
    expect(r.valores.JWT_SECRET).toBe(SEGREDO_DO_COMPOSE);
    expect(r.avisos.join(' ')).toMatch(/demonstra/i);
    expect(r.avisos.join(' ')).toMatch(/qualquer pessoa/i);
  });

  it('um segredo próprio em produção é aceito sem aviso de segredo', () => {
    const r = ler({ NODE_ENV: 'production', JWT_SECRET: SEGREDO_PROPRIO, COOKIE_SECURE: 'true' });
    expect(r.avisos).toEqual([]);
  });

  it('a autorização explícita não é "ligada" por valores estranhos', () => {
    expect(() => ler({ NODE_ENV: 'production', JWT_SECRET: SEGREDO_DO_COMPOSE, PERMITIR_SEGREDOS_DE_DEMONSTRACAO: 'sim' })).toThrowError();
    expect(() => ler({ NODE_ENV: 'production', JWT_SECRET: SEGREDO_DO_COMPOSE, PERMITIR_SEGREDOS_DE_DEMONSTRACAO: 'false' })).toThrowError(/JWT_SECRET/);
  });
});

describe('lerEnv: cookie de sessão sem Secure em produção', () => {
  it('avisa (sem recusar: o compose de demonstração usa HTTP)', () => {
    const r = ler({ NODE_ENV: 'production', JWT_SECRET: SEGREDO_PROPRIO });
    expect(r.avisos.join(' ')).toMatch(/COOKIE_SECURE/);
  });

  it('não avisa com COOKIE_SECURE=true, nem fora de produção', () => {
    expect(ler({ NODE_ENV: 'production', JWT_SECRET: SEGREDO_PROPRIO, COOKIE_SECURE: 'true' }).avisos).toEqual([]);
    expect(ler({ NODE_ENV: 'development', JWT_SECRET: SEGREDO_PROPRIO }).avisos).toEqual([]);
    expect(ler({ NODE_ENV: 'test', JWT_SECRET: SEGREDO_PROPRIO }).avisos).toEqual([]);
  });
});

describe('lerEnv: validações que já existiam', () => {
  it('segredo curto, DATABASE_URL ausente e NODE_ENV inválido são recusados com mensagem clara', () => {
    expect(() => ler({ JWT_SECRET: 'curto' })).toThrowError(/16 caracteres/);
    expect(() => lerEnv({ JWT_SECRET: SEGREDO_PROPRIO })).toThrowError(/DATABASE_URL/);
    expect(() => ler({ JWT_SECRET: SEGREDO_PROPRIO, NODE_ENV: 'staging' })).toThrowError(/NODE_ENV/);
  });

  it('aplica os padrões e converte tipos', () => {
    const { valores } = ler({ JWT_SECRET: SEGREDO_PROPRIO, PORT: '4000', TRUST_PROXY: 'true' });
    expect(valores).toMatchObject({ PORT: 4000, TRUST_PROXY: true, COOKIE_SECURE: false, JWT_EXPIRES_IN: '8h', NODE_ENV: 'development' });
  });
});
