import { Button } from '../components/ui';
import { Badge } from '../components/ui';
import StatusBadge from '../components/StatusBadge';

export default function ColorTest() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-base mb-2">Тест цветовой схемы</h1>
        <p className="text-text-muted">Страница для проверки семантических цветовых токенов</p>
      </div>

      {/* Кнопки */}
      <section className="bg-bg-card rounded-xl shadow-sm p-6 border border-border-light">
        <h2 className="text-lg font-semibold text-text-base mb-4">Кнопки</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      {/* Бейджи */}
      <section className="bg-bg-card rounded-xl shadow-sm p-6 border border-border-light">
        <h2 className="text-lg font-semibold text-text-base mb-4">Бейджи (Badge)</h2>
        <div className="flex flex-wrap gap-3">
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="leaders">Leaders</Badge>
          <Badge variant="success" dot>
            With Dot
          </Badge>
        </div>
      </section>

      {/* Статусы */}
      <section className="bg-bg-card rounded-xl shadow-sm p-6 border border-border-light">
        <h2 className="text-lg font-semibold text-text-base mb-4">Статусы (StatusBadge)</h2>
        <div className="flex flex-wrap gap-4">
          <StatusBadge status="active" />
          <StatusBadge status="completed" />
          <StatusBadge status="inprogress" />
          <StatusBadge status="notstarted" />
          <StatusBadge status="overdue" />
          <StatusBadge status="archived" />
          <StatusBadge status="low" />
          <StatusBadge status="medium" />
          <StatusBadge status="high" />
        </div>
      </section>

      {/* Алерты */}
      <section className="bg-bg-card rounded-xl shadow-sm p-6 border border-border-light">
        <h2 className="text-lg font-semibold text-text-base mb-4">Алерты / Баннеры</h2>
        <div className="space-y-4">
          <div className="p-4 bg-success-50 border border-success rounded-lg">
            <p className="text-text-base font-medium">Success Alert</p>
            <p className="text-text-muted text-sm mt-1">Операция выполнена успешно</p>
          </div>
          <div className="p-4 bg-warning-50 border border-warning rounded-lg">
            <p className="text-text-base font-medium">Warning Alert</p>
            <p className="text-text-muted text-sm mt-1">Требуется внимание</p>
          </div>
          <div className="p-4 bg-error-50 border border-error rounded-lg">
            <p className="text-text-base font-medium">Error Alert</p>
            <p className="text-text-muted text-sm mt-1">Произошла ошибка</p>
          </div>
          <div className="p-4 bg-info-50 border border-info rounded-lg">
            <p className="text-text-base font-medium">Info Alert</p>
            <p className="text-text-muted text-sm mt-1">Полезная информация</p>
          </div>
        </div>
      </section>

      {/* Карточки */}
      <section className="bg-bg-card rounded-xl shadow-sm p-6 border border-border-light">
        <h2 className="text-lg font-semibold text-text-base mb-4">Карточки и Текст</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-bg-card border border-border rounded-lg">
            <h3 className="text-text-base font-semibold mb-2">Базовый текст</h3>
            <p className="text-text-base">Основной текст контента</p>
            <p className="text-text-muted text-sm mt-1">Вторичный текст (muted)</p>
          </div>
          <div className="p-4 bg-bg-page border border-border rounded-lg">
            <h3 className="text-text-base font-semibold mb-2">Фон страницы</h3>
            <p className="text-text-base">bg-page фон</p>
          </div>
        </div>
      </section>

      {/* Цветовые образцы */}
      <section className="bg-bg-card rounded-xl shadow-sm p-6 border border-border-light">
        <h2 className="text-lg font-semibold text-text-base mb-4">Цветовые образцы</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-medium">Primary</div>
            <div className="h-16 rounded-lg bg-primary-hover flex items-center justify-center text-white text-sm font-medium">Primary Hover</div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-success flex items-center justify-center text-text-base text-sm font-medium">Success</div>
            <div className="h-16 rounded-lg bg-warning flex items-center justify-center text-white text-sm font-medium">Warning</div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-error flex items-center justify-center text-white text-sm font-medium">Error</div>
            <div className="h-16 rounded-lg bg-info flex items-center justify-center text-white text-sm font-medium">Info</div>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-secondary flex items-center justify-center text-white text-sm font-medium">Secondary</div>
            <div className="h-16 rounded-lg bg-bg-page border border-border flex items-center justify-center text-text-base text-sm font-medium">Bg Page</div>
          </div>
        </div>
      </section>

      {/* Формы */}
      <section className="bg-bg-card rounded-xl shadow-sm p-6 border border-border-light">
        <h2 className="text-lg font-semibold text-text-base mb-4">Формы</h2>
        <div className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-base mb-1">Поле ввода</label>
            <input 
              type="text" 
              className="block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Введите текст"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-base mb-1">Поле с ошибкой</label>
            <input 
              type="text" 
              className="block w-full px-3 py-2 border border-error rounded-md shadow-sm focus:outline-none focus:ring-error focus:border-error sm:text-sm"
              placeholder="Ошибка валидации"
            />
            <p className="mt-1 text-xs text-error">Это поле обязательно</p>
          </div>
        </div>
      </section>
    </div>
  );
}
