import { BrowserRouter, Routes, Route } from 'react-router-dom'
import useThemeStore from './store/themeStore'
import StarBackground from './components/StarBackground'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Button from './components/Button'
import Card from './components/Card'
import Input from './components/Input'
import Select from './components/Select'
import Tag from './components/Tag'
import Avatar from './components/Avatar'
import Rating from './components/Rating'

function DemoPage() {
  const { isDark } = useThemeStore()
  return (
    <div className="page-wrapper" style={{ background: 'var(--bg)' }}>
      <StarBackground isDark={isDark} intensity="reduced" />
      <div className="glow-blob glow-1" />
      <div className="glow-blob glow-2" />
      <div className="glow-blob glow-3" />

      <Navbar />

      <div style={{ paddingTop: 96, paddingBottom: 80, position: 'relative', zIndex: 2 }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>

          {/* Buttons */}
          <section>
            <h2 style={{ marginBottom: 20, fontSize: 18, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 }}>Кнопки</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button variant="primary" icon="plus">Создать проект</Button>
              <Button variant="green" icon="check">Принять заявку</Button>
              <Button variant="outline" icon="search">Найти работу</Button>
              <Button variant="danger" icon="trash">Удалить</Button>
              <Button variant="primary" size="sm">Маленькая</Button>
              <Button variant="primary" size="lg" iconRight="arrow-right">Большая</Button>
              <Button variant="primary" loading>Загрузка...</Button>
            </div>
          </section>

          {/* Tags */}
          <section>
            <h2 style={{ marginBottom: 20, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase' }}>Теги и статусы</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color="purple">React</Tag>
              <Tag color="green">Python</Tag>
              <Tag color="amber">В работе</Tag>
              <Tag color="red">Срочно</Tag>
              <Tag status="open" />
              <Tag status="in_progress" />
              <Tag status="delivered" />
              <Tag status="completed" />
              <Tag status="disputed" />
              <Tag status="cancelled" />
            </div>
          </section>

          {/* Avatar + Rating */}
          <section>
            <h2 style={{ marginBottom: 20, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase' }}>Аватары и рейтинг</h2>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <Avatar name="Азиз Саидов" size={56} online />
              <Avatar name="Камила Юсупова" size={44} />
              <Avatar size={36} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Rating value={4.9} count={87} />
                <Rating value={3.5} count={12} size={11} />
              </div>
            </div>
          </section>

          {/* Inputs */}
          <section>
            <h2 style={{ marginBottom: 20, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase' }}>Поля ввода</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 800 }}>
              <Input label="Email" placeholder="you@example.com" icon="mail" />
              <Input label="Пароль" type="password" placeholder="••••••••" icon="lock" />
              <Input label="С ошибкой" placeholder="Введите текст" error="Обязательное поле" />
              <Select
                label="Категория"
                placeholder="Выберите категорию"
                options={[
                  { value: 'dev', label: 'Разработка' },
                  { value: 'design', label: 'Дизайн' },
                  { value: 'marketing', label: 'Маркетинг' },
                ]}
              />
              <Input label="Поиск" placeholder="Найти проект..." icon="search" iconRight="adjustments-horizontal" />
              <Input label="Бюджет" placeholder="50 000" icon="currency-dollar" hint="Минимальная сумма в TJS" />
            </div>
          </section>

          {/* Cards */}
          <section>
            <h2 style={{ marginBottom: 20, fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 1, textTransform: 'uppercase' }}>Карточки</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { title: 'Разработка сайта', budget: '200 000 TJS', tag: 'open', skills: ['React', 'Node.js'] },
                { title: 'Дизайн логотипа', budget: '50 000 TJS', tag: 'in_progress', skills: ['Figma', 'Illustrator'] },
                { title: 'SEO оптимизация', budget: '80 000 TJS', tag: 'delivered', skills: ['SEO', 'Analytics'] },
              ].map((p) => (
                <Card key={p.title}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</h3>
                    <Tag status={p.tag} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                    {p.skills.map((s) => <Tag key={s} color="purple">{s}</Tag>)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--accent)' }}>{p.budget}</span>
                    <Button variant="outline" size="sm" iconRight="arrow-right">Подробнее</Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<DemoPage />} />
      </Routes>
    </BrowserRouter>
  )
}
