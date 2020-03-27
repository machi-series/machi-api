'use strict'

/*
|--------------------------------------------------------------------------
| DatabaseSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')
const Tag = use('App/Models/Tag')
const User = use('App/Models/User')

class DatabaseSeeder {
  async run() {
    const tags = [
      {
        name: 'Ação',
        slug: 'acao',
      },
      {
        name: 'Action',
        slug: 'action',
      },
      {
        name: 'Adventure',
        slug: 'adventure',
      },
      {
        name: 'Amizade',
        slug: 'amizade',
      },
      {
        name: 'Artes Marciais',
        slug: 'artes-marciais',
      },
      {
        name: 'Artes Marcial',
        slug: 'artes-marcial',
      },
      {
        name: 'Aventura',
        slug: 'aventura',
      },
      {
        name: 'Beisebol',
        slug: 'beisebol',
      },
      {
        name: 'Carros',
        slug: 'carros',
      },
      {
        name: 'Clubes',
        slug: 'clubes',
      },
      {
        name: 'Comédia',
        slug: 'comedia',
      },
      {
        name: 'Comédia Romântica',
        slug: 'comedia-romantica',
      },
      {
        name: 'Comedy',
        slug: 'comedy',
      },
      {
        name: 'Culinária',
        slug: 'culinaria',
      },
      {
        name: 'Cyberpunk',
        slug: 'cyberpunk',
      },
      {
        name: 'Demônios',
        slug: 'demonios',
      },
      {
        name: 'Distopia',
        slug: 'distopia',
      },
      {
        name: 'Documentário',
        slug: 'documentario',
      },
      {
        name: 'Drama',
        slug: 'drama',
      },
      {
        name: 'Ecchi',
        slug: 'ecchi',
      },
      {
        name: 'Escola',
        slug: 'escola',
      },
      {
        name: 'Escolar',
        slug: 'escolar',
      },
      {
        name: 'Espaço',
        slug: 'espaco',
      },
      {
        name: 'Esporte',
        slug: 'esporte',
      },
      {
        name: 'Esportes',
        slug: 'esportes',
      },
      {
        name: 'Fantasia',
        slug: 'fantasia',
      },
      {
        name: 'Ficção Científica',
        slug: 'ficcao-cientifica',
      },
      {
        name: 'Futebol',
        slug: 'futebol',
      },
      {
        name: 'Game',
        slug: 'game',
      },
      {
        name: 'Girl battleships',
        slug: 'girl-battleships',
      },
      {
        name: 'Harém',
        slug: 'harem',
      },
      {
        name: 'Hentai',
        slug: 'hentai',
      },
      {
        name: 'Historia',
        slug: 'historia',
      },
      {
        name: 'Historial',
        slug: 'historial',
      },
      {
        name: 'Historical',
        slug: 'historical',
      },
      {
        name: 'Histórico',
        slug: 'historico',
      },
      {
        name: 'Horror',
        slug: 'horror',
      },
      {
        name: 'Humor Negro',
        slug: 'humor-negro',
      },
      {
        name: 'Ídolo',
        slug: 'idolo',
      },
      {
        name: 'Infantis',
        slug: 'infantis',
      },
      {
        name: 'Investigação',
        slug: 'investigacao',
      },
      {
        name: 'Isekai',
        slug: 'isekai',
      },
      {
        name: 'Jogo',
        slug: 'jogo',
      },
      {
        name: 'Jogos',
        slug: 'jogos',
      },
      {
        name: 'Josei',
        slug: 'josei',
      },
      {
        name: 'Kids',
        slug: 'kids',
      },
      {
        name: 'Live Action',
        slug: 'live-action',
      },
      {
        name: 'Luta',
        slug: 'luta',
      },
      {
        name: 'Maduro',
        slug: 'maduro',
      },
      {
        name: 'Máfia',
        slug: 'mafia',
      },
      {
        name: 'Magia',
        slug: 'magia',
      },
      {
        name: 'Mágica',
        slug: 'magica',
      },
      {
        name: 'Mangá',
        slug: 'manga',
      },
      {
        name: 'Mecha',
        slug: 'mecha',
      },
      {
        name: 'Militar',
        slug: 'militar',
      },
      {
        name: 'Militares',
        slug: 'militares',
      },
      {
        name: 'Military',
        slug: 'military',
      },
      {
        name: 'Mistério',
        slug: 'misterio',
      },
      {
        name: 'Música',
        slug: 'musica',
      },
      {
        name: 'Musical',
        slug: 'musical',
      },
      {
        name: 'Não Informado!',
        slug: 'nao-informado',
      },
      {
        name: 'Paródia',
        slug: 'parodia',
      },
      {
        name: 'Piratas',
        slug: 'piratas',
      },
      {
        name: 'Polícia',
        slug: 'policia',
      },
      {
        name: 'Policial',
        slug: 'policial',
      },
      {
        name: 'Político',
        slug: 'politico',
      },
      {
        name: 'Pós-Apocalíptico',
        slug: 'pos-apocaliptico',
      },
      {
        name: 'Psico',
        slug: 'psico',
      },
      {
        name: 'Psicológico',
        slug: 'psicologico',
      },
      {
        name: 'Romance',
        slug: 'romance',
      },
      {
        name: 'Samurai',
        slug: 'samurai',
      },
      {
        name: 'Samurais',
        slug: 'samurais',
      },
      {
        name: 'Sátiro',
        slug: 'satiro',
      },
      {
        name: 'School Life',
        slug: 'school-life',
      },
      {
        name: 'Sci-Fi',
        slug: 'sci-fi',
      },
      {
        name: 'SciFi',
        slug: 'scifi',
      },
      {
        name: 'Seinen',
        slug: 'seinen',
      },
      {
        name: 'Shotacon',
        slug: 'shotacon',
      },
      {
        name: 'Shoujo',
        slug: 'shoujo',
      },
      {
        name: 'Shoujo Ai',
        slug: 'shoujo-ai',
      },
      {
        name: 'Shounem',
        slug: 'shounem',
      },
      {
        name: 'Shounen',
        slug: 'shounen',
      },
      {
        name: 'Shounen-ai',
        slug: 'shounen-ai',
      },
      {
        name: 'Slice of Life',
        slug: 'slice-of-life',
      },
      {
        name: 'Sobrenatural',
        slug: 'sobrenatural',
      },
      {
        name: 'Space',
        slug: 'space',
      },
      {
        name: 'Super Poder',
        slug: 'super-poder',
      },
      {
        name: 'Super-Poderes',
        slug: 'super-poderes',
      },
      {
        name: 'Supernatural',
        slug: 'supernatural',
      },
      {
        name: 'Suspense',
        slug: 'suspense',
      },
      {
        name: 'tear-studio',
        slug: 'tear-studio',
      },
      {
        name: 'Terror',
        slug: 'terror',
      },
      {
        name: 'Thriller',
        slug: 'thriller',
      },
      {
        name: 'Tragédia',
        slug: 'tragedia',
      },
      {
        name: 'Universo Alternativo.',
        slug: 'universo-alternativo',
      },
      {
        name: 'Vampiro',
        slug: 'vampiro',
      },
      {
        name: 'Vampiros',
        slug: 'vampiros',
      },
      {
        name: 'Vida Escolar',
        slug: 'vida-escolar',
      },
      {
        name: 'Yaoi',
        slug: 'yaoi',
      },
      {
        name: 'Yuri',
        slug: 'yuri',
      },
      {
        name: 'Zombie',
        slug: 'zombie',
      },
    ]

    const users = [
      {
        role: 'admin',
        username: 'admin',
        password: 'admin',
        email: 'admin@example.com',
      },
      {
        role: 'manager',
        username: 'manager',
        password: 'manager',
        email: 'manager@example.com',
      },
      {
        role: 'publisher',
        username: 'publisher',
        password: 'publisher',
        email: 'publisher@example.com',
      },
      {
        role: 'user',
        username: 'member',
        password: 'member',
        email: 'member@example.com',
      },
    ]

    await Tag.createMany(tags)
    await User.createMany(users)
  }
}

module.exports = DatabaseSeeder
