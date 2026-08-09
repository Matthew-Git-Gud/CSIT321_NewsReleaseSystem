import { useMemo, useState } from 'react'
import './App.css'

type Article = {
  id: number
  title: string
  excerpt: string
  category: string
  author: string
  publishedAt: string
  readTime: string
  accent: string
}

const articles: Article[] = [
  {
    id: 1,
    title: 'Singapore neighbourhoods turn empty spaces into community gardens',
    excerpt: 'Residents are working with local groups to transform underused corners into greener shared spaces.',
    category: 'Local',
    author: 'Amelia Tan',
    publishedAt: 'Today, 9:20 AM',
    readTime: '4 min read',
    accent: 'garden',
  },
  {
    id: 2,
    title: 'What the next generation of battery technology could change',
    excerpt: 'Researchers are exploring safer materials that could make energy storage cheaper and more durable.',
    category: 'Technology',
    author: 'Darren Lim',
    publishedAt: 'Today, 8:05 AM',
    readTime: '6 min read',
    accent: 'battery',
  },
  {
    id: 3,
    title: 'Young athletes prepare for a busy regional sports season',
    excerpt: 'Training programmes are expanding as more schools invest in competitive and inclusive sport.',
    category: 'Sports',
    author: 'Nur Aisyah',
    publishedAt: 'Yesterday',
    readTime: '3 min read',
    accent: 'sports',
  },
  {
    id: 4,
    title: 'Small businesses find new ways to reach their communities',
    excerpt: 'Independent businesses are pairing physical events with online tools to build loyal local audiences.',
    category: 'Business',
    author: 'Marcus Lee',
    publishedAt: 'Yesterday',
    readTime: '5 min read',
    accent: 'business',
  },
  {
    id: 5,
    title: 'Scientists map a clearer path for coastal conservation',
    excerpt: 'A new monitoring effort brings citizen observations and environmental data together.',
    category: 'Science',
    author: 'Siti Rahman',
    publishedAt: '2 days ago',
    readTime: '7 min read',
    accent: 'science',
  },
  {
    id: 6,
    title: 'A practical guide to protecting your focus in a busy week',
    excerpt: 'Simple routines can help people set healthier boundaries around work, rest and notifications.',
    category: 'Lifestyle',
    author: 'Jia Wen',
    publishedAt: '2 days ago',
    readTime: '4 min read',
    accent: 'lifestyle',
  },
]

const categories = ['All', ...Array.from(new Set(articles.map((article) => article.category)))]

function App() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredArticles = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    return articles.filter((article) => {
      const matchesCategory = activeCategory === 'All' || article.category === activeCategory
      const matchesSearch = !query || `${article.title} ${article.excerpt} ${article.category}`.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchTerm])

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Newsroom home">The Daily Post</a>
        <nav aria-label="Primary navigation">
          <a className="active" href="#latest">Latest</a>
          <a href="#categories">Categories</a>
          <a href="#about">About</a>
        </nav>
        <div className="header-actions">
          <button className="sign-in" type="button">Sign in</button>
          <button className="join" type="button">Join us</button>
        </div>
      </header>

      <section className="intro" id="top">
        <p className="eyebrow">Community journalism, made accessible</p>
        <h1>Stories that matter, from people who care.</h1>
        <p className="intro-copy">Discover fresh perspectives, local updates and thoughtful reporting from our community.</p>
        <label className="search" htmlFor="article-search">
          <span aria-hidden="true">⌕</span>
          <input
            id="article-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search stories"
            type="search"
          />
        </label>
      </section>

      <section className="content" id="latest" aria-labelledby="latest-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Browse articles</p>
            <h2 id="latest-heading">Latest stories</h2>
          </div>
          <p className="article-count">{filteredArticles.length} {filteredArticles.length === 1 ? 'story' : 'stories'} found</p>
        </div>

        <div className="category-list" id="categories" aria-label="Filter articles by category">
          {categories.map((category) => (
            <button
              className={category === activeCategory ? 'selected' : ''}
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        {filteredArticles.length ? (
          <div className="article-grid">
            {filteredArticles.map((article) => (
              <article className="article-card" key={article.id}>
                <div className={`article-image ${article.accent}`} aria-hidden="true"><span>{article.category}</span></div>
                <div className="article-body">
                  <p className="category">{article.category}</p>
                  <h3><a href={`/articles/${article.id}`}>{article.title}</a></h3>
                  <p className="excerpt">{article.excerpt}</p>
                  <div className="article-meta">
                    <span>By {article.author}</span>
                    <span>{article.publishedAt}</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No stories found</h3>
            <p>Try another search term or select a different category.</p>
            <button type="button" onClick={() => { setSearchTerm(''); setActiveCategory('All') }}>Clear filters</button>
          </div>
        )}
      </section>

      <footer id="about">The Daily Post · A community news platform</footer>
    </main>
  )
}

export default App
