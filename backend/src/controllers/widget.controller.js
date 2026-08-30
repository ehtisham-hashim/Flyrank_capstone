import { WidgetService } from '../services/widget.service.js';

export class WidgetController {
  static async create(req, res, next) {
    try {
      const widget = await WidgetService.createWidget(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: widget,
      });
    } catch (err) {
      next(err);
    }
  }

  static async list(req, res, next) {
    try {
      const widgets = await WidgetService.listWidgets(req.user.id);
      res.status(200).json({
        success: true,
        data: widgets,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const widget = await WidgetService.getWidgetById(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        data: widget,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req, res, next) {
    try {
      const widget = await WidgetService.updateWidget(req.user.id, req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: widget,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req, res, next) {
    try {
      const result = await WidgetService.deleteWidget(req.user.id, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getSnippet(req, res, next) {
    try {
      const widget = await WidgetService.getWidgetById(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        snippet: widget.embedSnippet,
      });
    } catch (err) {
      next(err);
    }
  }
}
