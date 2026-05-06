window.ARCANO_ARCHIVE = {
  index: {
    title: "O Arcano",
    subtitle: "Um RPG dark fantasy sobre sobreviventes, magia viva e mana morta.",
    image: "assets/images/hero-arcano.png",
    paragraphs: [
      "Há terras onde os deuses dormem. Há mundos onde a esperança nunca acordou.",
      "Em O Arcano, a luz é fraca, a terra geme sob séculos de guerra e a sobrevivência raramente é uma vitória limpa. Impérios ruíram, cidades apodreceram atrás de muralhas famintas, e a paz tornou-se apenas uma palavra antiga.",
      "A magia não é bênção. É carne, febre e condenação. Magos carregam no próprio corpo uma força viva, instável e perigosa, enquanto não-magos ferem Cristais de Mana para aprisionar energia morta em armas e couraças.",
      "Neste mundo, não existem heróis escolhidos. Toda magia cobra. Toda escolha deixa marcas. Todo combate pode ser o último."
    ],
    pillars: [
      {
        title: "Magia viva",
        text: "Poder arcano como febre, mutação, desejo e colapso físico."
      },
      {
        title: "Mana morta",
        text: "Cristalurgia de guerra, ferro negro e tecnologia feita de horror."
      },
      {
        title: "Sobrevivência",
        text: "Personagens que tropeçam, sangram, negociam e seguem."
      }
    ]
  },

  tabs: [
    {
      id: "Index",
      title: "Index",
      tone: "Página inicial do arquivo."
    },
    {
      id: "Itens",
      title: "Itens",
      tone: "Relíquias, armas, couraças e objetos contaminados por mana.",
      template: ["Tipo", "Raridade", "Custo", "Efeito", "Revés"]
    },
    {
      id: "Magias",
      title: "Magias",
      tone: "Poderes vivos, instáveis, sempre cobrados no corpo.",
      template: ["Círculo", "Tradição", "Custo", "Efeito", "Colapso"]
    },
    {
      id: "Bestiario",
      title: "Bestiário",
      tone: "Criaturas, horrores, pragas e inimigos não humanos.",
      template: ["Tipo", "Habitat", "Instinto", "Perigo", "Espólio"]
    },
    {
      id: "Paises",
      title: "Países",
      tone: "Reinos, fronteiras, domínios e territórios em disputa.",
      template: ["Capital", "Governo", "Conflito", "Recurso", "Segredo"]
    },
    {
      id: "Cenarios",
      title: "Cenários",
      tone: "Locais, ruínas, cidades, rotas e regiões de campanha."
    },
    {
      id: "Eras",
      title: "Eras",
      tone: "Linhas do tempo, quedas, guerras e cicatrizes históricas."
    },
    {
      id: "Sistemas",
      title: "Sistemas",
      tone: "Regras, módulos, custos e procedimentos de mesa."
    },
    {
      id: "Persona",
      title: "Persona",
      tone: "NPCs, arquétipos, patronos, rivais e sobreviventes.",
      template: ["Papel", "Desejo", "Método", "Ferida", "Cena"]
    },
    {
      id: "Grupos",
      title: "Grupos",
      tone: "Ordens, facções, cultos, casas e bandos."
    },
    {
      id: "Racas",
      title: "Raças",
      tone: "Povos jogáveis, linhagens, culturas e marcas de origem.",
      template: ["Origem", "Traço", "Cultura", "Conflito", "Rumor"]
    },
    {
      id: "Mapa",
      title: "Mapa",
      tone: "Mapa do mundo, rotas, regiões e pontos de interesse."
    },
    {
      id: "Deuses",
      title: "Deuses",
      tone: "Divindades caladas, cultos, santos e teologias quebradas."
    }
  ],

  entries: [
    {
      id: "lamina-de-mana-morta",
      tab: "Itens",
      title: "Lâmina de Mana Morta",
      image: "assets/images/crystal-forge.png",
      summary: "Arma cristalúrgica criada para romper proteções arcanas.",
      fields: {
        Tipo: "Arma média ou longa",
        Raridade: "Rara",
        Custo: "Favor militar, cristal intacto ou dívida nobre",
        Efeito: "Instabiliza magias sustentadas ao atingir o alvo",
        Revés: "Cada trinca aumenta o risco de descarga no usuário"
      },
      body: [
        "A lâmina não odeia magos. Ela apenas reconhece magia viva como diferença de pressão e tenta corrigir o mundo pela ferida."
      ]
    },
    {
      id: "couraca-de-cristal-ferido",
      tab: "Itens",
      title: "Couraça de Cristal Ferido",
      image: "assets/images/crystal-forge.png",
      summary: "Armadura pesada com veios de cristal morto.",
      fields: {
        Tipo: "Armadura pesada",
        Raridade: "Muito rara",
        Custo: "Reservada a arsenais de guerra",
        Efeito: "Reduz impactos arcanos diretos",
        Revés: "O usuário sonha memórias que não viveu"
      },
      body: [
        "Muitos soldados preferem morrer sem ela. Outros vestem a couraça e deixam de responder ao próprio nome depois de algumas campanhas."
      ]
    },
    {
      id: "cristal-vivo",
      tab: "Itens",
      title: "O Cristal Vivo",
      image: "assets/images/living-crystal.png",
      summary: "Relíquia impossível que pulsa como coisa nascida.",
      fields: {
        Tipo: "Relíquia ou entidade",
        Raridade: "Única",
        Custo: "Nenhuma moeda compra algo que reescreve o comprador",
        Efeito: "Pode alterar uma consequência recente",
        Revés: "Cada uso torna incerta a versão do usuário"
      },
      body: [
        "Alguns dizem que ele nasceu antes dos deuses dormirem. Outros dizem que é o cadáver de um destino recusado."
      ]
    },
    {
      id: "chama-da-febre-branca",
      tab: "Magias",
      title: "Chama da Febre Branca",
      image: "assets/images/mage-collapse.png",
      summary: "Fogo arcano que queima frio na pele do conjurador.",
      fields: {
        Círculo: "II",
        Tradição: "Fogo e Carne",
        Custo: "Marca de Calor ou Vigor temporário",
        Efeito: "Labareda branco-violeta que busca feridas abertas",
        Colapso: "O conjurador perde a sensação de calor até descansar"
      },
      body: [
        "A chama obedece porque reconhece a febre que a chamou."
      ]
    },
    {
      id: "vento-de-ossos",
      tab: "Magias",
      title: "Vento de Ossos",
      image: "assets/images/mage-collapse.png",
      summary: "Rajada cortante feita de cinza, poeira e memória mineral.",
      fields: {
        Círculo: "I",
        Tradição: "Ar e Ruína",
        Custo: "Respirar cinza, pó de osso ou poeira de ruína",
        Efeito: "Empurra, corta e revela superfícies cobertas por pó",
        Colapso: "O mago fica sem voz até receber cuidado"
      },
      body: [
        "É comum entre errantes porque quase todo lugar em O Arcano oferece pó, cinza ou restos."
      ]
    },
    {
      id: "sangue-que-recorda",
      tab: "Magias",
      title: "Sangue que Recorda",
      image: "assets/images/mage-collapse.png",
      summary: "Ritual menor capaz de ouvir memórias recentes no sangue.",
      fields: {
        Círculo: "II",
        Tradição: "Sangue e Memória",
        Custo: "Misturar uma gota do próprio sangue à amostra",
        Efeito: "Revela impressão sensorial dos últimos instantes",
        Colapso: "Uma memória alheia parece própria até o sono"
      },
      body: [
        "A resposta vem como lembrança invasiva, não como frase."
      ]
    }
  ]
};
