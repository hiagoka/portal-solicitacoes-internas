-- Dados de demonstração. Execute depois do schema.sql.
-- Senha de todos os usuários de teste: senha123 (armazenada como hash bcrypt)

INSERT INTO usuarios (nome, usuario, senha_hash, perfil) VALUES
    ('Ana Atendente', 'atendente', '$2b$10$vtXWQ8zS5kDa0Q/tCaPgNOFf4CCZKzBVmm678DHSSC4Np0k2Bzk2e', 'atendente'),
    ('Maria Souza',   'maria',     '$2b$10$D5TM0NB5Njd4eMgxGKfoTOck6tJTrFCeYvrrKxazN6Sy7S4PJqsPK', 'solicitante'),
    ('João Lima',     'joao',      '$2b$10$kT8KosKa6lC6fQ6dlGnmLucWfmwpn7.bexCCPsORDWK3HozgpPfOC', 'solicitante');

-- Datas relativas a NOW() para que os filtros por período sempre tenham dados variados.
-- usuario_id: 2 = maria, 3 = joao
INSERT INTO solicitacoes (titulo, descricao, categoria, status, usuario_id, criado_em, atualizado_em) VALUES
    ('Notebook não liga',            'O notebook do setor parou de ligar após queda de energia.',            'TI',             'aberto',         2, NOW() - INTERVAL '1 day',   NOW() - INTERVAL '1 day'),
    ('Acesso ao sistema financeiro', 'Preciso de acesso de leitura ao módulo de relatórios.',                'TI',             'em_atendimento', 2, NOW() - INTERVAL '3 days',  NOW() - INTERVAL '2 days'),
    ('Solicitação de férias',        'Gostaria de agendar férias para o mês de dezembro.',                   'RH',             'concluido',      2, NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days'),
    ('Compra de cadeiras',           'Três cadeiras ergonômicas para a equipe de suporte.',                  'Compras',        'aberto',         3, NOW() - INTERVAL '2 days',  NOW() - INTERVAL '2 days'),
    ('Reembolso de viagem',          'Reembolso das despesas da visita ao cliente em Recife.',               'Financeiro',     'em_atendimento', 3, NOW() - INTERVAL '5 days',  NOW() - INTERVAL '4 days'),
    ('Ar-condicionado com vazamento','O aparelho da sala 3 está pingando sobre as mesas.',                   'Infraestrutura', 'aberto',         3, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),
    ('Atualização de dados cadastrais','Alterar endereço e telefone no cadastro de funcionário.',            'RH',             'concluido',      3, NOW() - INTERVAL '40 days', NOW() - INTERVAL '38 days'),
    ('Licença de software de design','Renovação da licença anual do editor de imagens.',                     'Compras',        'concluido',      2, NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days'),
    ('Nota fiscal não localizada',   'Não encontro a NF do fornecedor de papelaria no sistema.',             'Financeiro',     'aberto',         2, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
    ('Lâmpadas queimadas no corredor','Várias lâmpadas do corredor do 2º andar precisam de troca.',          'Infraestrutura', 'em_atendimento', 3, NOW() - INTERVAL '8 days',  NOW() - INTERVAL '7 days');
