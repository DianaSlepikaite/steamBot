# Contributing to Discord Steam Bot

Thank you for your interest in contributing! This guide will help you get started with development.

## Development Setup

1. **Fork and clone the repository**
```bash
git clone <your-fork-url>
cd steamBot
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment**
```bash
cp .env.example .env
# Add your test bot credentials to .env
```

4. **Verify setup**
```bash
npm run check
```

5. **Build and run**
```bash
npm run build
npm run register
npm run dev  # runs with auto-reload
```

## Project Structure

```
src/
├── commands/       # Slash command handlers
├── database/       # Database setup and models
├── utils/          # Helper functions
├── index.ts        # Main bot entry
└── register-commands.ts
```

## Adding a New Command

1. **Create command file** in `src/commands/yourcommand.ts`:
```typescript
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { UserModel } from '../database/models';

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    // Your command logic here

    return interaction.editReply({
      content: 'Success!',
    });
  } catch (error: any) {
    console.error('Error in yourcommand:', error);
    return interaction.editReply({
      content: `An error occurred: ${error.message}`,
    });
  }
}
```

2. **Register the command** in `src/register-commands.ts`:
```typescript
new SlashCommandBuilder()
  .setName('yourcommand')
  .setDescription('Description of your command')
  .addStringOption(option =>
    option
      .setName('param')
      .setDescription('Parameter description')
      .setRequired(true)
  ),
```

3. **Import in main file** `src/index.ts`:
```typescript
import * as yourcommandCmd from './commands/yourcommand';

const commands = new Map([
  // ... existing commands
  ['yourcommand', yourcommandCmd],
]);
```

4. **Test your command**:
```bash
npm run build
npm run register
npm run dev
```

## Database Changes

If you need to modify the database schema:

1. **Update schema** in `src/database/db.ts`
2. **Update models** in `src/database/models.ts`
3. **Consider migration strategy** (SQLite doesn't have built-in migrations)

⚠️ **Note**: Schema changes may require recreating the database. Always backup production data!

## Code Style

- **TypeScript**: Use strict typing, avoid `any` when possible
- **Error Handling**: Always use try/catch in command handlers
- **Logging**: Use `console.log` for info, `console.error` for errors
- **Formatting**: Follow the existing code style
- **Comments**: Add comments for complex logic

## Testing

Currently, the project uses manual testing. Before submitting a PR:

1. Test your changes locally
2. Try edge cases (missing data, errors, etc.)
3. Ensure existing commands still work
4. Check console for errors

### Test Checklist

- [ ] Command works with valid input
- [ ] Handles invalid input gracefully
- [ ] Shows helpful error messages
- [ ] Doesn't crash the bot
- [ ] Works with private Steam profiles
- [ ] No TypeScript errors (`npm run build`)

## Common Development Tasks

### Adding a Database Query

In `src/database/models.ts`:
```typescript
export const YourModel = {
  yourQuery(param: string): ReturnType {
    const stmt = db.prepare('SELECT * FROM table WHERE column = ?');
    return stmt.get(param) as ReturnType;
  }
};
```

### Adding Steam API Integration

In `src/utils/steam.ts`:
```typescript
export async function yourSteamFunction(steamId: string) {
  try {
    const result = await steam.someMethod(steamId);
    return result;
  } catch (error: any) {
    console.error('Steam API error:', error);
    return null;
  }
}
```

### Creating Rich Embeds

```typescript
const embed = new EmbedBuilder()
  .setColor(0x66C0F4)
  .setTitle('Title')
  .setDescription('Description')
  .addFields(
    { name: 'Field 1', value: 'Value 1' },
    { name: 'Field 2', value: 'Value 2' }
  )
  .setFooter({ text: 'Footer text' })
  .setThumbnail('https://image-url.com/image.png');

return interaction.editReply({ embeds: [embed] });
```

## Debugging

### Enable Debug Logging

Set in `.env`:
```env
NODE_ENV=development
```

### Common Issues

**"Unknown interaction"**
- Interaction took >3 seconds to respond
- Always use `deferReply()` at the start

**TypeScript errors**
- Run `npm run build` to see all errors
- Check `tsconfig.json` settings

**Database locked**
- SQLite doesn't support concurrent writes
- Use transactions for multiple operations

## Pull Request Process

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**
- Follow code style
- Add comments
- Test thoroughly

3. **Commit your changes**
```bash
git add .
git commit -m "Add: description of your changes"
```

4. **Push and create PR**
```bash
git push origin feature/your-feature-name
```

5. **Describe your PR**
- What does it do?
- Why is it needed?
- How was it tested?

## Future Enhancement Ideas

From the original spec (Phase 4):

- [ ] Track recently played games
- [ ] Show playtime statistics
- [ ] Detect co-op/multiplayer games
- [ ] Multi-platform support (Epic, Xbox, PSN)
- [ ] Web dashboard for stats
- [ ] Automatic periodic library updates
- [ ] `/topshared` command
- [ ] Role assignment based on ownership

Other ideas:

- [ ] Game recommendations based on common games
- [ ] Price tracking and sale notifications
- [ ] Achievement comparison
- [ ] Game genre analysis
- [ ] Friends network visualization

## Questions?

- Check existing code for examples
- Read the [README.md](README.md)
- Review the [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- Look at Discord.js docs: https://discord.js.org/
- Check Steam API docs: https://steamcommunity.com/dev

## License

By contributing, you agree that your contributions will be licensed under the ISC License.
