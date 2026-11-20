# Prompt: mapear categorias para novos destinos

Use este prompt em um assistente de IA (ou como briefing de curadoria) para listar tudo o que se enquadra no Minas Explorer. O resultado alimenta o mapa `CATEGORIES` de `scripts/find-candidates.mjs`.

> Conferir sempre os identificadores no Wikidata antes de usar: um assistente pode errar um QID.

---

## Prompt

```text
Você é curador de dados turísticos de Minas Gerais (Brasil).

CONTEXTO
Tenho um guia turístico web (Minas Explorer) com um mapa e uma lista de destinos. Cada destino é um
ponto com coordenadas, pertence a um município de MG e tem uma categoria. As categorias do app são:

1. historic-heritage — Patrimônio histórico (centros históricos, casarões, monumentos, sítios arqueológicos, patrimônio tombado)
2. museum — Museus
3. church — Igrejas (matrizes, capelas, santuários, basílicas)
4. waterfall — Cachoeiras e poços
5. park — Parques e unidades de conservação (parques nacionais/estaduais/municipais, APAs, reservas)
6. mountain — Serras, trilhas e mirantes (picos, serras, mirantes, trilhas)
7. water — Lagos, rios e cânions (lagoas, represas, praias fluviais, cânions)
8. rural — Turismo rural (fazendas, engenhos, alambiques, rota do queijo)
9. gastronomy — Gastronomia (mercados, feiras, rotas gastronômicas, restaurantes emblemáticos)
10. other — Outros pontos de interesse (grutas, cavernas, jardins, balneários, estâncias hidrominerais)

REGRAS DO APP
- Só entram lugares visitáveis por turistas, dentro de Minas Gerais, com coordenadas confiáveis.
- Cada destino precisa de ao menos uma foto com licença livre (domínio público, CC0, CC BY ou CC BY-SA).
- Não entram empresas comuns, hospedagens, serviços ou lugares sem acesso público.

TAREFA
Para CADA categoria acima, devolva:
a) Os tipos de lugar que se enquadram (inclua sinônimos regionais, ex.: "poço", "salto", "cascata", "gruta", "lapa", "pico", "mirante").
b) As classes correspondentes no Wikidata (QID + rótulo em pt), separando classes amplas de classes específicas, e indicando quais costumam trazer ruído.
c) Propriedades do Wikidata úteis para filtrar (ex.: P131 localização administrativa, P625 coordenadas, P18 imagem, P1435 proteção patrimonial, P1585 código IBGE).
d) Tipos que NÃO devem entrar, mesmo parecendo relevantes.
e) Categorias ou tipos de destino turístico de Minas que NÃO estão cobertos pelas 10 categorias acima e que valeria acrescentar (com justificativa curta).

FORMATO
Tabela em Markdown por categoria, depois um bloco JSON final no formato:
{ "<categoria>": { "classes": ["Q..."], "excluir": ["Q..."], "observacoes": "..." } }

Não invente QIDs: se não tiver certeza de um identificador, escreva "verificar" ao lado.
```

---

## Como usar a resposta

1. Confira cada QID em `https://www.wikidata.org/wiki/<QID>`.
2. Ajuste o objeto `CATEGORIES` em `scripts/find-candidates.mjs`.
3. Rode `npm run candidates` (ou `-- --category=waterfall` para uma só) e revise `candidates/candidates.md`.
4. Para cada item aprovado, crie o JSON em `public/data/attractions/` com a foto local e rode `npm run catalog`.
