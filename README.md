# Landing page — 7 Invernos

Landing page comercial de página única para apresentar a 7 Invernos, explicar o atendimento e encaminhar visitantes ao WhatsApp. A solução segue o escopo Lite: não é loja virtual, catálogo ou sistema de reservas.

## Tecnologia

- HTML5 semântico
- CSS mobile-first, sem frameworks ou fontes externas
- JavaScript puro para menu mobile, links configuráveis e indicação da seção ativa
- Sem dependências, etapa de build ou serviços externos obrigatórios

## Estrutura

```text
7-invernos/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── config.js
│   └── main.js
└── README.md
```

## Executar localmente

Na pasta do projeto, execute:

```bash
python3 -m http.server 8080
```

Depois, acesse `http://localhost:8080`. Também é possível abrir `index.html` diretamente no navegador, mas o servidor local representa melhor uma hospedagem real.

## Dados que precisam ser substituídos

Todos os dados comerciais editáveis estão centralizados em `js/config.js`:

```js
window.SITE_CONFIG = Object.freeze({
  whatsapp: "INSERIR_WHATSAPP",
  instagram: "INSERIR_INSTAGRAM",
  maps: "INSERIR_LINK_GOOGLE_MAPS",
  address: "INSERIR_ENDERECO",
});
```

Use URLs completas nos três primeiros campos. Para o WhatsApp, use o link oficial no formato `https://wa.me/PAISDDDNUMERO`, apenas depois de confirmar o número real. Enquanto os marcadores estiverem presentes, os botões mostram um aviso e não abrem links inválidos.

## Materiais e informações pendentes

Obrigatórios antes da publicação:

- número/link oficial do WhatsApp;
- URL oficial do Instagram;
- endereço completo confirmado;
- link oficial da localização no Google Maps.

Opcionais, caso existam e estejam autorizados:

- logotipo oficial e favicon derivado da identidade existente;
- fotografias reais da empresa;
- horário de atendimento;
- avaliações autorizadas;
- domínio final, necessário para URL canônica e para decidir a criação de `robots.txt` e `sitemap.xml`.

Nenhum endereço, horário, domínio, depoimento, preço ou regra comercial foi inventado. A composição visual atual é abstrata e as cores estão centralizadas nas variáveis do início de `css/styles.css` para facilitar uma futura adequação à identidade oficial.

## Versão de produção e publicação

Não há build. Depois de substituir e testar os dados comerciais, publique a pasta mantendo a mesma estrutura de arquivos em uma hospedagem de sites estáticos já contratada. Configure `index.html` como documento inicial e HTTPS na própria hospedagem.

Antes de publicar:

1. substitua todos os marcadores `INSERIR_*` em `js/config.js`;
2. teste WhatsApp, Instagram e localização em celular e computador;
3. revise o conteúdo e os dados com a equipe da 7 Invernos;
4. adicione metadados de domínio somente após a confirmação da URL oficial.

## Recursos deliberadamente excluídos

Conforme o escopo Lite, não foram incluídos catálogo, filtros, busca, páginas de produtos, formulários, reservas, pagamentos, carrinho, estoque, login, CMS, banco de dados, analytics, chatbot, APIs, tradução ou qualquer painel administrativo.
