import Model, { attr } from "@ember-data/model";

export default class LinkModel extends Model {
  @attr eproid;
  @attr localid;
  @attr context;
}