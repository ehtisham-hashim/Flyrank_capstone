import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WidgetService } from '../services/widget.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const widgetScriptPath = path.resolve(__dirname, '../../../public/widget.js');

export class EmbedController {
  static async getConfig(req, res, next) {
    try {
      const config = await WidgetService.getPublicConfig(req.params.id);

      // Short-lived HTTP cache for widget config (60 seconds)
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.status(200).json(config);
    } catch (err) {
      next(err);
    }
  }

  static async getScript(req, res, next) {
    try {
      // Long-lived HTTP cache with immutable flag for versioned widget bundle
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      if (fs.existsSync(widgetScriptPath)) {
        const scriptContent = fs.readFileSync(widgetScriptPath, 'utf8');
        res.send(scriptContent);
      } else {
        res.status(404).send('// Widget script not found');
      }
    } catch (err) {
      next(err);
    }
  }
}
