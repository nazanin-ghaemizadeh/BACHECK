/* v56 — start each newly opened page with an empty assessment case.
   Authentication in sessionStorage is intentionally preserved. */
(function(){
  'use strict';
  try{
    ['bamco-vehicle-assessment','bamco-vehicle-expert-weights','bamco-manager-weight-control'].forEach(k=>localStorage.removeItem(k));
  }catch(_){}
  try{
    ['bamco-second-vehicle-comparison','bamco-multi-vehicle-comparisons','bamco-comparison-vehicle-count'].forEach(k=>sessionStorage.removeItem(k));
  }catch(_){}
})();
