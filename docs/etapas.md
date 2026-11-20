# Etapas do projeto

Fonte: prompt mestre (etapas 0 a 11) + etapa adicional definida durante o desenvolvimento.

| Etapa | Tema | Estado |
|---|---|---|
| 0 | Inspeção e planejamento | concluída |
| 1 | Fundação do projeto | concluída |
| 2 | Identidade visual e layout | concluída |
| 3 | Mapa Leaflet | concluída |
| 4 | Geografia e regiões | concluída |
| 5 | Modelos e catálogo JSON | concluída |
| 6 | Marcadores, busca e filtros (+ mapa minimalista focado em MG) | concluída |
| 7 | Detalhes de cidades e atrações | pendente |
| 8 | Favoritos e roteiros | pendente |
| 9 | Curadoria e expansão do catálogo | pendente |
| 10 | Qualidade, acessibilidade e otimização | pendente |
| 11 | GitHub Pages e documentação final | pendente |
| **12** | **Modo escuro (dark mode)** | **pendente (adicionada)** |

## Etapa 12 — Modo escuro (dark mode)

**Objetivo:** oferecer tema claro e escuro em toda a aplicação, respeitando a preferência do sistema e permitindo escolha manual.

**Escopo**
- Tokens escuros em `src/styles/_tokens.scss` (superfícies, texto, bordas, verdes da marca) e tema escuro do Angular Material (`color-scheme`).
- Alternador de tema no cabeçalho (claro / escuro / sistema), acessível por teclado, com nome e estado anunciados.
- Preferência salva em LocalStorage (com `try/catch`: indisponível ou inválido cai para "sistema"); aplicada antes do primeiro render para evitar "flash" de tema errado.
- Mapa: o visual minimalista já usa variáveis CSS (`--me-map-bg`, `--me-map-mask`, `--me-map-tile-filter`), então o tema escuro só redefine essas variáveis (tiles escurecidos por filtro CSS, sem trocar de provedor de tiles). A máscara fora de MG relê `--me-map-mask` ao trocar de tema.
- Marcadores, popups, chips, cards, estados vazios e rodapé revisados nos dois temas.
- Contraste mínimo WCAG AA verificado nos dois temas; respeitar `prefers-reduced-motion` na transição.

**Fora do escopo:** temas adicionais, personalização de cores pelo usuário.

**Aceite**
- Todas as telas legíveis e consistentes nos dois temas, sem texto ilegível nem elementos "estourados".
- Preferência persiste após recarregar; sem LocalStorage, o app continua funcionando.
- Mapa legível no escuro, com o estado de Minas Gerais em destaque.
- Testes do serviço de tema (sistema, escolha manual, storage indisponível) e build de produção aprovados.

**Ordem sugerida:** pode ser feita antes da Etapa 10 (para auditar contraste/acessibilidade já nos dois temas) ou depois da 11. Decisão do responsável pelo projeto.
