import Controller from "@ember/controller";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import { task, lastValue } from "ember-concurrency-decorators";
import {
  languageOptions,
  periodOfConstructionOptions,
} from "ember-ebau-gwr/models/options";

export default class SearchBuildingController extends Controller {
  @service gwr;
  @service intl;
  @service notification;

  @tracked activeBuilding;

  periodOfConstruction = periodOfConstructionOptions;

  @lastValue("search") searchResults;
  @task *search(query) {
    try {
      query.streetLang = languageOptions[this.intl.primaryLocale];
      query.municipality = this.gwr.municipality;
      return yield this.gwr.searchBuilding(query);
    } catch (error) {
      console.error(error);
      this.notification.danger("ember-gwr.searchBuilding.searchError");
    }
  }

  @task *linkBuilding(EGID, buildingWork) {
    try {
      yield this.gwr.bindBuildingToConstructionProject(
        this.model,
        EGID,
        buildingWork
      );
      this.activeBuilding = null;
      this.transitionToRoute("project.linked-buildings", this.model);
      this.notification.success(
        this.intl.t("ember-gwr.searchBuilding.linkSuccess")
      );
    } catch (error) {
      console.error(error);
      this.notification.danger(
        this.intl.t("ember-gwr.searchBuilding.linkError")
      );
    }
  }

  @action
  setActiveBuilding(EGID) {
    this.activeBuilding = EGID;
  }
}
