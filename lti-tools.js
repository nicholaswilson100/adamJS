(function(){

  // ****************************************************************************************************************************************************
  // writes out a hyperlink to site followed by link to the LTI page for the tool in question in site (which will launch the tool)
  // ****************************************************************************************************************************************************
 
  // ******************************************************
  // Assumes only one LTI tool per Sakai page
  // ******************************************************

  // get tool id for the attribute data-lti-tool-id
  var toolId;
  var div;
  $(document).ready(function(){ 
    toolId = $("#lti-tools").attr("data-lti-tool-id"); 
    div = $(document.getElementById("lti-tools"));
  });

  var ul = $("<ul class='recorded-lectures-list'/>");

  $.getJSON( "/direct/membership.json", function( data ) {

    var mems = data.membership_collection;

    $.each( mems, function( key, val ) {

      // site URL
      var url = "/portal"+val.locationReference;

      // Site ID
      var siteId = url.substring(13);

      if (siteId == "!admin") { // ignore

      }
      else {
        // now get details of lti tools on a site, 
        // NB we need to handle 403 errors as it's possible a second factor of auth may be needed to get a contents listing from some sites
        var siteLtiToolsJsonUrl = "/direct/lti/"+siteId+"/contents.json";

        try {
        
          $.getJSON( siteLtiToolsJsonUrl, function( data ) {
            
            var listItems = data.list;
            // loop over each list element 
            $.each( listItems, function( key, val ) {

              if (val.tool_id == toolId) {

                // grab placement ID from JSON
                var placementId = val.placement;

                // now get launch URL
                var pagesJsonUrl = "/direct/site/"+siteId+"/pages.json";
                $.getJSON( pagesJsonUrl, function( data ) {

                  // declare the LTI url
                  var replayLtiUrl = "/URL/goes/here";

                  // declare the page name
                  var pageName;

                  // for breaking when we've written out the ink to the LTI tool
                  var haveFoundThePage = false;

                  // loop over each page, get details of tools on the page
                  for (i = 0; i < data.length; i++) {

                    if (haveFoundThePage) { break; }

                    var tools = data[i].tools; 
       
                    // if tools is empty, return
                    if (null == tools) { console.log("No tools on site: "+siteId); return; }
                  
                    var toolNum = 0;
        
                     // ** Optimisation ** 
                     // we're assuming there's only 1 (LTI) tool per page so we just get placementId of first tool on site, ie, tools[0]

                      if (placementId  == data[i].tools[0].placementId) {
                        haveFoundThePage = true;

                        replayLtiUrl = data[i].tools[0].url;
                        pageName = data[i].title;

                        // get site name
                        var siteTitle;

                        // If there's a siteId of "info" then this is the guidance site, NB, '/direct/site/info.json' is a reserved URL
                        if ("info" == siteId) { 
                          siteTitle = "Guidance Site";
                          ul.append("<li><a href=\"" + url + "\" title=\""+siteTitle+"\">" + siteTitle + "</a> <a href=\"" + replayLtiUrl + "\" title=\""+siteTitle + " (" + pageName +")\">("+pageName+")</a></li>" );
                        }
                        else {

                          var siteJsonUrl = "/direct/site/"+siteId+".json";

                          $.getJSON( siteJsonUrl, function( data ) {
                            siteTitle = data.title;
                            ul.append("<li><a href=\"" + url + "\" title=\""+siteTitle+"\">" + siteTitle + "</a> <a href=\"" + replayLtiUrl + "\" title=\""+siteTitle + " (" + pageName +")\">("+pageName+")</a></li>" );
                          }); // end get siteJsonUrl

                        } // end if siteId = info  

                        return; // we've written out the link to the LTI tool, NB,  we are assuming there's only one LTI tool on a Sakai page

                      } // end of if placement id

                  } // for loop over data
                }); // end of page URL get JSON 
              } // end of if( toolId = )
            }); // end of foreach list item
        })} catch (err) { console.log("Error getting site contents; "+err.message);}; // end of get site contents / lti tools URL
      }
    }); // end of for each mems
    $('#spinner').hide();

    div .append(ul);

  }); // end of get JSON memberships

})();
