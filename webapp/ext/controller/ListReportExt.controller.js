sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/comp/smartfilterbar/SmartFilterBar",
    "sap/ui/core/format/NumberFormat"
], function (Filter, SmartFilterBar,  NumberFormat) {
    "use strict";

    return {
        getCustomAppStateDataExtension: function (oCustomData) {
            //the content of the custom field will be stored in the app state, so that it can be restored later, for example after a back navigation.
            //The developer has to ensure that the content of the field is stored in the object that is passed to this method.
            //     if (oCustomData) {
            //          var oCustomField1 = this.oView.byId("User_Control");
            //          if (oCustomField1) {
            //              oCustomData.User_uid = oCustomField1.getSelectedKey();
            //         }
            //     }
        },
        restoreCustomAppStateDataExtension: function (oCustomData) {
            //in order to restore the content of the custom field in the filter bar, for example after a back navigation,
            //an object with the content is handed over to this method. Now the developer has to ensure that the content of the custom filter is set to the control
            //    if (oCustomData) {
            //         if (oCustomData.User_uid) {
            //            var oComboBox = this.oView.byId("User_Control");
            //            oComboBox.setSelectedKey(
            //               oCustomData.User_uid
            //            );
            //        }
            //   }
        },
        onBeforeRebindTableExtension: function (oEvent) {


            var oBindingParams = oEvent.getParameter("bindingParams");
            oBindingParams.parameters = oBindingParams.parameters || {};

            // Get source calling
            var oSmartTable = oEvent.getSource();
            // Get instance
            var oSmartFilterBar = this.byId(oSmartTable.getSmartFilterId());


                // Check is a real instance of Smart Filter
                if (oSmartFilterBar instanceof SmartFilterBar) {
                

                    var oCustomOTPFilter = oSmartFilterBar.getControlByKey("OTPFilter");
                    var oCustomCustomerFilter = oSmartFilterBar.getControlByKey("CustomerFilter");
                    
                    var vInputValue_customer = this.byId("in_customer").getValue();
                    var vInputValue_otp = this.byId("in_otp").getValue();

                    var  oUserModel =  this.getView().getModel("userInfo");
                    oBindingParams.filters.push(new sap.ui.model.Filter("UniqueId", sap.ui.model.FilterOperator.EQ, oUserModel.name));
              
                    //OTP Filter Selectd 
                    if(vInputValue_otp !== '' ){  
                    oBindingParams.filters.push(new sap.ui.model.Filter("WBSElement", sap.ui.model.FilterOperator.EQ, vInputValue_otp));
                    } else {     
                        oBindingParams.filters.push(new sap.ui.model.Filter("UniqueId", sap.ui.model.FilterOperator.EQ, this._UniqueId ));
                    }

                    if(vInputValue_customer  !== '' ){   
                    oBindingParams.filters.push(new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.EQ, vInputValue_customer));
                    }
            

                }
          },
               getUserInfo: function () {
                        const url = this.getBaseURL() + "/user-api/currentUser";
                        var oModel = new sap.ui.model.json.JSONModel();
                        var mock = {
                            firstname: "Dummy",
                            lastname: "User",
                            email: "dummy.user@com",
                            name: "dummy.user@com",
                            displayName: "Dummy User (dummy.user@com)"
                        };

                        oModel.loadData(url);
                        oModel.dataLoaded()
                            .then(() => {
                                //check if data has been loaded
                                //for local testing, set mock data
                                //  if (!oModel.getData().email) {
                                //      oModel.setData(mock);
                                //  }
                                this.getView().setModel(oModel, "userInfo");
                                debugger;
                            })
                            .catch(() => {
                                oModel.setData(mock);
                                this.getView().setModel(oModel, "userInfo");
                            });
                },

                getBaseURL: function () {
                    var appId = "ch.unige.regfund.zregfundgen2"; //this.getOwnerComponent().getManifestEntry("/sap.app/id");
                    var appId2 = this.getOwnerComponent().getManifestEntry("/sap.app/id");

                    var appPath = appId.replaceAll(".", "/");
                    var appModulePath = jQuery.sap.getModulePath(appPath);
                    return appModulePath;
                },


        onInit: function () {


            var that = this;
         

            const url_user = this.getBaseURL() + "/user-api/currentUser";

            
                var oUserModel = {
                    firstname: "",
                    lastname: "",
                    email: "",
                    name: "",
                    displayName: ""
                };

                $.ajax({
                    method: "GET",
                    url: url_user,
                    async: false,
                    success: function (result, xhr, data) {
                    //var user_name = data.responseJSON.name;

                    oUserModel = result ;
                    that.getView().setModel(oUserModel, "userInfo");

                
                }
                    
                });
           
           // Access Controle --> OTP
                var su = this.getOwnerComponent().getModel("ZSB_GESTION_ACCES").sServiceUrl  ;
                this.oODataModel = new sap.ui.model.odata.ODataModel(su, true);
                var oODataJSONModelOTP = new sap.ui.model.json.JSONModel();
                su = su + "/ZI_GEST_ACCES_OTP";
                
                var aFilters = [];
                aFilters.push(new Filter("UniqueId", sap.ui.model.FilterOperator.EQ, oUserModel.name));
               // aFilters.push(new Filter("Object", sap.ui.model.FilterOperator.NotContains, "G-"));


                this.oODataModel.read("/ZI_GEST_ACCES_OTP" ,{
                        filters: aFilters,
                        success: 
                                function (oData, oResponse) {
                                    //  set the odata JSON as data of JSON model
                                    oODataJSONModelOTP.setData(oData);
                                    var oOTP = JSON.parse(JSON.stringify(oODataJSONModelOTP.getData()));
                                
                                    // Create filter OTP
                                    that._set_OTP_Filter(oOTP);
                            
                                }
                    });

            // Access Controle --> OTP --> END



            ////this.getUserInfo();

            //Model pour la demande à Regularizer
            sap.ui.getCore().setModel(oUserModel, "userInfo");
            this._UniqueId = oUserModel.name;



            //Model pour la demande à Regularizer
            sap.ui.getCore().setModel(this.getOwnerComponent().getModel("Regularize"), "Regularize");

            //Model pour le Total de la demande à Regularizer
            sap.ui.getCore().setModel(this.getOwnerComponent().getModel("Total"), "Total");

        },


            /**
             * Create [] Filter for OTP
             * @param {object} oOTP
             * @public
            **/

           _set_OTP_Filter: function (oOTP) {

             var aFilters = [];
             var bFilters = [];
              if ( oOTP.results.length > 0 ) {


                for (var d = 0; d < oOTP.results.length; d++) {
                    aFilters.push(new sap.ui.model.Filter('WBSElementExternalID', sap.ui.model.FilterOperator.EQ, oOTP.results[d].Objet))
                }

                this._OTP_Filter =  [new sap.ui.model.Filter(aFilters, false)] ;

               } else {
      
                this._OTP_Filter =  [];

                     // aFilters.push(new Filter("UniqueId", sap.ui.model.FilterOperator.EQ, that._user_name ));
                };
           


              //Model pour OTP filtre
              var oOTPFilter =  this.getOwnerComponent().getModel("OTPFilter");
              oOTPFilter =  this._OTP_Filter;
              sap.ui.getCore().setModel(oOTPFilter, "OTPFilter");


           },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */


		/**
		 * Launch the XXXX search according to current filters
		 * @param {object} oEvent The event
		 * @public
		 * */
		//onSearch: function(oEvent) {
		//	this.getView().byId("goodsreceiptlist").getBinding("items").filter(this._getFilters());
		//},



        /**
         * Triggered by the table's 'updateFinished' event: after new table
         * data is available, this handler method updates the table counter.
         * This should only happen if the update was successful, which is
         * why this handler is attached to 'updateFinished' and not to the
         * table's list binding's 'dataReceived' method.
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */

        onBeforeRendering: function ( )  {

            let oControlTable = this.getView().byId("listReport");
            var oTable = oControlTable.getTable(); //The table instance    
            var oBinding = oTable.getBinding("items");
            var oBindingInfo = oTable.getBindingInfo("items");


            var aFilters = [];
            aFilters.push(new Filter("Currentuser", sap.ui.model.FilterOperator.EQ, this._Codeisis));
            aFilters.push(new Filter("Controle", sap.ui.model.FilterOperator.EQ, ""));

            oTable.addEventDelegate({ })

            //  oTable.bindAggregation("items", {
            //     model: oBindingInfo.model,
            //    path: oBindingInfo.path,
            //     parameters: oBindingInfo.parameters,
            //     template: oBindingInfo.template,
            //    filters: aFilters
            //               });


        },

        onAfterRendering: function (oEvent) {

            // filter binding
            //   var oList = this.getView().byId("listReport");
            //    var oBinding = oList.getBinding("items");

            //       let oButton = this.getView().byId("listReportFilter-btnGo");
            //           oButton.firePress();

        },

        // onBeforeNavigation 

        onListNavigationExtension: function (oEvent) {

            let oContext = oEvent.getSource().getBindingContext();
            let oData = oContext.getObject();

            // get JSON Moodel
            var oRegularize = sap.ui.getCore().getModel("Regularize");

            oRegularize.setProperty("/Societe", oData.CompanyCode);
            oRegularize.setProperty("/Documentnumber", oData.DocumentNumber);
            oRegularize.setProperty("/Gjahr", oData.FiscalYear);



            var oRegularizeLines = oRegularize.getProperty("/toItems");
            oRegularizeLines = [];
            var oRegularizeLine = {};


            oRegularizeLine.Societe = oData.CompanyCode;
            oRegularizeLine.Documentnumber = oData.DocumentNumber;
            oRegularizeLine.Gjahr = oData.FiscalYear;

            oRegularizeLine.Centre = oData.Centre;

            const myArray = oData.Compte.split("-");
            const allSpacesRemoved = myArray[0].replaceAll(' ', '');


                // I prpose a Debit Line  -- 40
            oRegularizeLine.Compte = allSpacesRemoved;
            oRegularizeLine.Divise = oData.Divise;


            var oCurrencyFormat = NumberFormat.getCurrencyInstance();
            oCurrencyFormat.format( oData.Montant, oData.Divise);  

            oRegularizeLine.Montant = oData.Montant;
            oRegularizeLine.Wbselement =  ""; //oData.WBSElement;
            oRegularizeLine.Txt = myArray[1];
 
            oRegularizeLines.push(oRegularizeLine);

            oRegularize.setProperty("/toItems", oRegularizeLines)

            var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
            const component = sap.ui.getCore().getComponent(sComponentId);



            var oODataFiles = new sap.ui.model.json.JSONModel();
 
            var su = this.getOwnerComponent().getModel("Z_GENERIC_FUNDS_REGUL_SRV").sServiceUrl  ; // "/sap/opu/odata/sap/Z_GENERIC_FUNDS_REGUL_SRV/",
            this.oODataModel = new sap.ui.model.odata.ODataModel(su, true);

  


         // Total de la Demande -> Defaul = valuer de la pièce
            var oTotal = sap.ui.getCore().getModel("Total");

            var oCurrencyFormat = NumberFormat.getCurrencyInstance({
                currencyCode: false
            });
             
           var tot_format = oCurrencyFormat.format(oData.Montant, oData.Divise); // returns ¥1,235
      
 
            oTotal.setProperty("/Total", tot_format );
            oTotal.setProperty("/Total_Reg", tot_format );
          
            // set my  Total JSON
            component.setModel(oTotal, "Total");


             // set my  Regularize JSON
             component.setModel(oRegularize, "Regularize");


                // get the Backend Data
                var key_query = 'RegFundHeaderSet(Documentnumber=' +  "'" + oData.DocumentNumber+  "'"  + ',Gjahr=' +  "'"  
                +  oData.FiscalYear + "'"  + ',Societe=' +  "'"  + oData.CompanyCode +  "'"      + ")";

               // GET THE FILES PARKET DOCUMENT  
               var key_query =  key_query +   "/toFiles" ;
     
                 var   that = this; 
                 this.oODataModel.read(key_query ,{
                                success: 
                                        function (oData, oResponse) {
                                            oODataFiles.setData(oData);
                                            var oFiles = JSON.parse(JSON.stringify(oODataFiles.getData()));

                                            var oRegularizeFiles = oRegularize.getProperty("/toFiles");
                                            oRegularizeFiles = [];

                                             if ( oFiles.results.length > 0 ) {
                                                for (var d = 0; d < oFiles.results.length; d++) {
                                                    delete oFiles.results[d].__metadata;
                                                    oRegularizeFiles.push(oFiles.results[d]);
                                                
                                                }
                                              };


                                            that._setRouterPrefix_in_Files(oRegularizeFiles);

                                            oRegularize.setProperty("/toFiles", oRegularizeFiles)
                                             // set my  Regularize JSON
                                       
                                             component.setModel(oRegularize, "Regularize");


                                                                        
                                            //   syncronize XML View with  Json model  
                                             oRegularize.refresh();



                                        }
                                    });	 


             },


                /**
                  * Save Files into Posting.json
                  * @param {object} [] oFiles  
                  * @public
                **/
              
                _setRouterPrefix_in_Files: function (oFiles) {
              
                    // add APP Router Prefix
    
                    for (var j = 0; j < oFiles.length; j++) {
                      var oAttachmentURL =  this.getBaseURL() + oFiles[j].Url;
                      oFiles[j].Url = oAttachmentURL;
                  
                    }
        
                  },


 
 
        /**
         * Launch OTP Search Help dialog
         * @param {object} oEvent The event
         * @public
         * */
        onValueHelpRequestOTP: function (oEvent) {
            if (!this.dialog1) {
                this.dialog1 = sap.ui.xmlfragment("idFragment1", "ch.unige.regfund.zregfundgen2.ext.fragment.OTPlr", this);
                this.getView().addDependent(this.dialog1);
            }

            
            // Access Controle --> Apply OTP Filter
            var fragmentID = "idFragment1--ch.unige.regfund.zregfundgen2.OTPSelectDialog";
            var r = sap.ui.getCore().byId(fragmentID);
            var i = r.getBindingInfo("items");

            r.bindAggregation("items", 
            {
              model: i.model, 
              path: i.path, 
              parameters: i.parameters,
              template: i.template, 
              filters: this._OTP_Filter
            })
           // Access Controle --> Apply OTP Filter --> End


            this.dialog1.open();
            return this.dialog1;
        },


        /**
          *  OTP Cancel Button
          * @param {object} oEvent The event
          * @public
          * */

        onOTPCancelButtonPress: function () {
            this.dialog1.close();     // First: close fragment
            // take care: necessary to destry ? error adding element with duplicate id....
            //   this.dialog.destroy(); //Second: destoy fragment  
            //   this.dialog=null;      // Third: null name/pointer 
        },

        onOTPSearch: function (oEvent) {
            var fragmentID = "idFragment1--ch.unige.regfund.zregfundgen2.OTPSelectDialog";
            var array_filter = ["WBSElementExternalID", "WBSDescription",
                "ProjectDescription", "Fund_Desc", "PGrant_Desc"];
            this._onOTPSearch(oEvent, fragmentID, array_filter)
        },

        _onOTPSearch: function (e, fragmentID, array_filter) {
            var r = sap.ui.getCore().byId(fragmentID);

            //   r._aSelectedPaths

            var i = r.getBindingInfo("items");

            var s = e.getParameter("query") || e.getParameter("newValue");
            var n = [];
            var l = [];

            if (s && s.length > 0) {
                for (var d = 0; d < array_filter.length; d++) {
                    l.push(new sap.ui.model.Filter(array_filter[d], sap.ui.model.FilterOperator.Contains, s))
                }
            }
            n = l.length > 0 ? [new sap.ui.model.Filter(l, false)] : [];
            r.bindAggregation("items", {
                model: i.model, path: i.path, parameters: i.parameters,
                template: i.template, filters: n
            })
        },

        onOTPOkButtonPress: function (oEvent) {
            var t = sap.ui.getCore().byId("idFragment1--ch.unige.regfund.zregfundgen2.OTPSelectDialog");

            // get WBE Selected     
            var oWBE = t.getSelectedItem().getBindingContext("Z_WBS_ELEMENT_SBIND").getObject();

            let ui_otp_Name =    oWBE.WBSElementExternalID + ' - '   +  oWBE.WBSDescription;
            this.byId("in_otp").setValue(ui_otp_Name);
           //idFragment1--SearchFieldODP
            this.dialog1.close();
        },

        /**
        * Launch Customer Search Help dialog
        * @param {object} oEvent The event
        * @public
        **/
        onValueHelpRequestCustomer: function (oEvent) {
            if (!this.dialog2) {
                this.dialog2 = sap.ui.xmlfragment("idFragment2", "ch.unige.regfund.zregfundgen2.ext.fragment.CustomerSearchDialog", this);
                this.getView().addDependent(this.dialog2);
            }

            this.dialog2.open();
            return this.dialog2;
        },
        /**
         *  CustomerCancel Button
         * @param {object} oEvent The event
         * @public
         * */

        onCustomerCancelButtonPress: function () {
            this.dialog2.close();     // First: close fragment
            // take care: necessary to destry ? error adding element with duplicate id....
            //   this.dialog.destroy(); //Second: destoy fragment  
            //   this.dialog=null;      // Third: null name/pointer 
        },

        onCustomerSearch: function (oEvent) {
            var fragmentID = "idFragment2--ch.unige.regfund.zregfundgen2.SupplierSelectDialog";
            var array_filter = ["Vendor", "Nameup",
                                "Street", "City", "Country"];
            this._onSupplierSearch(oEvent, fragmentID, array_filter)
        },

        _onSupplierSearch: function (e, fragmentID, array_filter) {
            var r = sap.ui.getCore().byId(fragmentID);


            var i = r.getBindingInfo("items");

            var s = e.getParameter("query") || e.getParameter("newValue");
            var n = [];
            var l = [];

            if (s && s.length > 0) {
                for (var d = 0; d < array_filter.length; d++) {
                    l.push(new sap.ui.model.Filter(array_filter[d], sap.ui.model.FilterOperator.Contains, s))
                }
            }
            n = l.length > 0 ? [new sap.ui.model.Filter(l, false)] : [];
            r.bindAggregation("items", {
                model: i.model, path: i.path, parameters: i.parameters,
                template: i.template, filters: n
            })
        },
    
        onCustomerOkButtonPress: function (oEvent) {
            var t = sap.ui.getCore().byId("idFragment2--ch.unige.regfund.zregfundgen2.SupplierSelectDialog");

            // get Supplier Selected     
            var oSupplier  = t.getSelectedItem().getBindingContext("Z_GENERIC_FUNDS_REGUL_SRV").getObject();


             let ui_Supplier_Name =   oSupplier.Vendor + ' - ' +  oSupplier.Name
            this.byId("in_customer").setValue(ui_Supplier_Name);

            // this.byId("idFragment2--SearchFieldCustomer-I").setValue('');  // Clear Fragment sap.m.SearchField field

            this.dialog2.close();


        }
    };
});