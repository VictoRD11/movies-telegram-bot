import doSearch from './functions/doSearch'

export default (bot, defaultProviders) => {
    bot.on('callback_query', async (ctx) => {
        await doSearch(ctx, defaultProviders, ctx.callbackQuery.data)
        return ctx.answerCbQuery()
    })
    bot.on('text', async (ctx) => doSearch(ctx, defaultProviders, ctx.message.text))
}