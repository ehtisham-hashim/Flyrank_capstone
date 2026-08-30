import { DashboardService } from '../services/dashboard.service.js';

export class DashboardController {
  static async getSubmissions(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const widgetId = req.query.widgetId;

      const result = await DashboardService.getSubmissions(req.user.id, { page, limit, widgetId });
      res.status(200).json({
        success: true,
        data: result.submissions,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await DashboardService.getStats(req.user.id);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getGeoStats(req, res, next) {
    try {
      const geo = await DashboardService.getGeoStats(req.user.id);
      res.status(200).json({
        success: true,
        data: geo,
      });
    } catch (err) {
      next(err);
    }
  }
}
