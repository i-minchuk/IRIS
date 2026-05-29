# Настройка CDN для ДокПоток IRIS

## CloudFront (AWS)
1. Создать S3 bucket для статики
2. Настроить CloudFront distribution
3. Указать origin — S3 bucket
4. Настроить caching policies

## Cloudflare
1. Добавить домен в Cloudflare
2. Настроить Page Rules для кэширования
3. Включить Auto Minify

## Nginx конфигурация
