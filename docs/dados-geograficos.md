# Dados geográficos

## Fonte

Todos os dados desta etapa vêm da **API de dados abertos do IBGE** (`servicodados.ibge.gov.br/api`), obtidos em 20/11/2026:

| Dado | Endpoint |
|---|---|
| Contorno de MG (malha estadual, qualidade `intermediaria`, GeoJSON) | `v3/malhas/estados/31?formato=application/vnd.geo+json&qualidade=intermediaria` |
| Regiões Geográficas Intermediárias de MG (13) | `v1/localidades/estados/31/regioes-intermediarias` |
| Municípios de MG (853) | `v1/localidades/estados/31/municipios` |

**Licença/termos:** o IBGE publica esses dados como dados abertos, mas **os termos de uso exatos ainda não foram confirmados por nós**. Pendência: conferir a licença vigente no portal do IBGE e registrar aqui antes da publicação. Crédito a manter: "Fonte: IBGE".

## Tratamento

Script reproduzível: [`scripts/prepare-geo-data.mjs`](../scripts/prepare-geo-data.mjs)

```bash
node scripts/prepare-geo-data.mjs               # baixa da API e gera os arquivos
node scripts/prepare-geo-data.mjs --from <dir>  # usa arquivos já baixados
```

Saídas em `public/data/`:

- `geo/minas-gerais.geo.json`: contorno estadual (1 polígono, 876 pontos, ~17 KB). A qualidade `intermediaria` foi escolhida porque a `minima` (372 pontos) simplifica demais a forma. Nenhuma alteração geométrica foi feita pelo projeto. A extensão `.geo.json` permite importar o arquivo em testes.
- `regions.json`: 13 regiões (`id` = código IBGE, `slug`, `municipalityIds`).
- `municipalities.json`: índice de 853 municípios (`id` = código IBGE de 7 dígitos, `name`, `slug`, `regionId`).

O script valida: 1 feature com `codarea` 31, 13 regiões, 853 municípios, ids e slugs únicos e todo município apontando para uma região existente (os testes em `geo-data.spec.ts` repetem essas checagens).

**Correção de grafia:** a API retorna "Juíz de Fora"; o projeto normaliza para "Juiz de Fora" (`NAME_FIXES` no script).

## Regiões

Usamos as **Regiões Geográficas Intermediárias do IBGE** (divisão vigente desde 2017). Não são as "regiões turísticas" do estado nem as antigas mesorregiões; um agrupamento turístico, se desejado, será uma decisão editorial futura.

## Coordenadas

Os registros de município e região **não têm coordenadas**: o IBGE não as fornece nesses endpoints e nada foi inventado. Coordenadas de referência serão definidas, com fonte, para as cidades e atrações do catálogo (Etapa 5), por exemplo a partir da malha municipal do IBGE ou de fonte documentada por registro.

## Uso no app

`GeoDataService` lê os arquivos por URL relativa ao `<base href>`. O contorno é desenhado como referência visual no mapa (não limita a navegação). O retângulo de enquadramento inicial (`MINAS_VIEW_BOUNDS`) foi derivado do retângulo envolvente do contorno.
