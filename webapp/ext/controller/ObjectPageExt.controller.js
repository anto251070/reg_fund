sap.ui.define([
    "sap/m/MessageBox",
    "../../model/formatter",
     "sap/ui/core/format/NumberFormat",
     "sap/ui/model/Filter",
     'sap/ui/model/FilterOperator',
     "sap/ui/export/library",
     "sap/ui/export/Spreadsheet",
     'sap/ui/model/Sorter'
     ], function (MessageBox, formatter, NumberFormat, Filter, FilterOperator, exportLibrary, Spreadsheet,Sorter) {
        "use strict";
        var EdmType = exportLibrary.EdmType;

    return {
        formatter: formatter,
        _index: null,
        _keyfragmenrt1: null,
        _keyfragmenrt2: null,

            onInit: function () {
    
                // Global references
                this._oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
                this._oText = this._oComponent.getModel("i18n").getResourceBundle();

                //get global model OTPFilter.json loaded in the ListReport Controller
                this._OTP_Filter =  sap.ui.getCore().getModel("OTPFilter");


                // keis for the fragments in case are aready bounded
                  const d = new Date();

                 let minutes = d.getMinutes();
                 let ms = d.getMilliseconds();

                  this._keyfragmenrt1 = "a" + minutes + ms ;
                  this._keyfragmenrt2 = "b" + minutes + ms ;
    
            },

            onBeforeRendering: function () {

                var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
                const component = sap.ui.getCore().getComponent(sComponentId);


            },

            post_regularise: function (oEvent) {

                // Check Total of Items

                var a = this.byId("ch.unige.regfund.zregfundgen2txt.Total").getText();
                var b = this.byId("ch.unige.regfund.zregfundgen2txt.Total.Items").getText();
    
                if ( a  !== b) {
                    debugger;

                   // POP UP the amount don't match


                    this._showServiceError("Les montants ne correspond pas");

 
                    return;

                } else { 
                    
                    
                   // POP UP a WBE is missed


                    var oPosting  =  sap.ui.getCore().getModel("Regularize");
         
                    var oRegularizeLines = oPosting.getProperty("/toItems");

                     if (this._checkotp(oRegularizeLines)){ 
           
                 
                      this.openConfirmDialog("sRegTitle", "sRegText");
                
                    
                    } else { 
                    


                    this._showServiceError("Il faut selectione l'OTP");


                    } 
                
                }


            },

               /**
             * openConfirmDialog
             * Generic Confirmation Dialog for reuse
             * @param oRegularizeLine
             * @return true / false
             * */
       
               _checkotp: function (oRegularizeLine) {
       

                     var status = true;

                    for (var r = 0; r < oRegularizeLine.length; r++) {
    
    
                        if ( oRegularizeLine[r].Wbselement === "") {

                            status =false;
                                break;
                        
                        }


                    }



                    if (status)  { 

                       return true;
                      } else {

                       return false;

                    }

               },


            /**
             * openConfirmDialog
             * Generic Confirmation Dialog for reuse
             * @param sRegTitle
             * @param sRegText
             * */
            openConfirmDialog: function (Title, Text) {
                var that = this;
                var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;


                MessageBox.confirm(
                    this._oText.getText(Text), {

                    title: this._oText.getText(Title),

                    actions: [sap.m.MessageBox.Action.OK, "Annuler"],

                    styleClass: bCompact ? "sapUiSizeCompact" : "",

                    onClose: function (sAction) {
                        if (sAction === sap.m.MessageBox.Action.OK) {
                            that._regularize("OK");
                        }
                    }
                }
                );
                return false;
            },

            /**
                 * _showSuccessMessageSave
                 * Generic Confirmation Dialog for reuse
                 * @param  oRegularisationResponse
                 * */
            _showSuccessMessageSave: function (NewDocumentnumber, NewGjahr) {
            
                var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;

                MessageBox.confirm(
                    'Le document: ' + NewDocumentnumber  + ' ' + NewGjahr + ' a été créé!' , {
                        
                    title: this._oText.getText('sRegTitle'),

                    actions: [sap.m.MessageBox.Action.OK],

                    styleClass: bCompact ? "sapUiSizeCompact" : "",

                    onClose: function (sAction) {
                        if (sAction === sap.m.MessageBox.Action.OK) {
                            this._reloadApp();
                        } 
                
                    }.bind(this)
                }
                );
                return false;
            },

            _showServiceError: function(responseText) {

                MessageBox.error(
                    responseText, {

                   //     id:  this._keyfragmenrt1, //"serviceErrorsMessageBoxCR",
                        title: this._oText.getText('sRegTitle'),
                        
                        textAlignment: "Center",

                        actions: [sap.m.MessageBox.Action.OK],
                        onClose: function() {
                        //    this._reloadApp(); 
                        /**
                         *  Si ma régularisation n’est pas conforme => l’appli reste sur l’écran de la pièce en question lorsqu’il y a une erreur.
                         */


                       // this.byId("ch.unige.regfund.zregfundgen2::sap.suite.ui.generic.template.ObjectPage.view.Details::GenericFunds--Item::WBSElement::Field-text").setText("test");

                        }.bind(this)
                    }
                );

            },


            _reloadApp: function() {
 
 
                var oNavCtrl = this.extensionAPI.getNavigationController();
                oNavCtrl.navigateExternal("NavigationID");
           

            },


        onExit: function() {
            if (this.dialog) {
       
 
              this.dialog=undefined;
    
        
            }
            if (this.dialogACC) {
       
 
                this.dialogACC=undefined;
      
          
              }
        },


        /** 
        * _regularize
        * @param aArguments  OK or KO
        */

        _regularize: function (aArguments) {

            if (aArguments === "OK") {

                var oJsonRegularize = JSON.parse(JSON.stringify(sap.ui.getCore().getModel("Regularize").getData()));


                if (!oJsonRegularize.toFiles) {
                    delete oJsonRegularize.toFiles;

                } else {
                    for (var j = 0; j < oJsonRegularize.toFiles.length; j++) {
                        var oAttachment = oJsonRegularize.toFiles[j];

  
                        delete oAttachment.Description;
                        delete oAttachment.Url;

                    }
                }

                //get Odata Model Z_GENERIC_FUNDS_REGUL_SRV

                var oODataModel = this.getOwnerComponent().getModel('Z_GENERIC_FUNDS_REGUL_SRV');

                //set to the view
                this.getView().setModel(oODataModel);

                // Handle request sent
                oODataModel.attachEventOnce("requestSent", function (oEvent) {
                    sap.ui.core.BusyIndicator.show();
                }, this);

                // Handle request failed
                oODataModel.attachEventOnce("requestFailed", function (oEvent) {
                    // Enable_ButtonSoumettre button
                    if (this.byId("ch.unige.regfund.zregfundgen2::sap.suite.ui.generic.template.ObjectPage.view.Details::GenericFunds--action::id_RegulariserButton")) {
                        this.byId("ch.unige.regfund.zregfundgen2::sap.suite.ui.generic.template.ObjectPage.view.Details::GenericFunds--action::id_RegulariserButton").setEnabled(true);
                    }

                    var oParams = oEvent.getParameters();
                    var err_data = JSON.parse(oParams.response.responseText);
                    this._showServiceError(err_data.error.message.value);
                }, this);



                // Handle request success
                oODataModel.attachEventOnce("requestCompleted", function (oEvent) {

                    sap.ui.core.BusyIndicator.hide();

                    if (oEvent.getParameters().success) {

        	          //  Enable "Regularise" button
                        if (this.byId("ch.unige.regfund.zregfundgen2::sap.suite.ui.generic.template.ObjectPage.view.Details::GenericFunds--action::id_RegulariserButton")) {
                            this.byId("ch.unige.regfund.zregfundgen2::sap.suite.ui.generic.template.ObjectPage.view.Details::GenericFunds--action::id_RegulariserButton").setEnabled(true);
                        }
                         var oRegularisationResponse = JSON.parse(oEvent.getParameters().response.responseText).d;
                         var NewDocumentnumber   = oRegularisationResponse.NewDocumentnumber  ;
                         var NewGjahr   = oRegularisationResponse.NewGjahr ;


                        this._showSuccessMessageSave(NewDocumentnumber, NewGjahr);
    
                    }
                }, this);

                debugger;

               oODataModel.create("/RegFundHeaderSet", oJsonRegularize, null, null, null);

         	     //  Disable "Regularise" button
			      	if (this.byId("ch.unige.regfund.zregfundgen2::sap.suite.ui.generic.template.ObjectPage.view.Details::GenericFunds--action::id_RegulariserButton")) {
			      		this.byId("ch.unige.regfund.zregfundgen2::sap.suite.ui.generic.template.ObjectPage.view.Details::GenericFunds--action::id_RegulariserButton").setEnabled(false);
		           }
 

            }
        },
              ////////////////////////Element OTP Filter ///////////////////////
            onODPFilterSelect: function (oEvent) {
                
                var t = oEvent.getSource().getBindingContext("Regularize").getPath();
                this._index = t.substr(t.length - 1);




               // var r = sap.ui.getCore().byId("idFragment--ch.unige.regfund.zregfundgen2.Dialog");
    
                        if (!this.dialog) {
                            this.dialog = sap.ui.xmlfragment( this._keyfragmenrt1,     //"idFragment", 
                                                             "ch.unige.regfund.zregfundgen2.ext.fragment.OTP", this);
                            this.getView().addDependent(this.dialog);


                        }
    

                    // Access Controle --> Apply OTP Filter
                    var fragmentID =  this._keyfragmenrt1 +  "--ch.unige.regfund.zregfundgen2.OTPSelectDialog"; // "idFragment--ch.unige.regfund.zregfundgen2.OTPSelectDialog";
                    var r = sap.ui.getCore().byId(fragmentID);
                    var i = r.getBindingInfo("items");

                    r.bindAggregation("items", 
                    {
                        model: i.model, 
                        path: i.path, 
                        parameters: i.parameters,
                        template: i.template //, 
                     //   filters: this._OTP_Filter  <= Access Controle désactivé 
                    })
                    // Access Controle --> Apply OTP Filter --> End
                    



                this.dialog.open();
                return this.dialog;
            },

            onOTPCancelButtonPress: function () {
                this.dialog.close();     // First: close fragment
                // take care: necessary to destry ? error adding element with duplicate id....
                //   this.dialog.destroy(); //Second: destoy fragment  
                //   this.dialog=null;      // Third: null name/pointer 
            },

            onOTPSearch: function (e) {

        
                var fragmentID = this._keyfragmenrt1 +  "--ch.unige.regfund.zregfundgen2.OTPSelectDialog"; // "idFragment--ch.unige.regfund.zregfundgen2.OTPSelectDialog"; 
                var array_filter = ["WBSElementExternalID", "WBSDescription",
                    "ProjectDescription", "Fund_Desc", "PGrant_Desc"];
                this._onOTPSearch(e, fragmentID, array_filter)
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
                    model: i.model, 
                    path: i.path, 
                    parameters: i.parameters,
                    template: i.template, 
                    filters: n
                })
            },


            onOTPOkButtonPress: function (e) {

               
              //  var t = sap.ui.getCore().byId("idFragment--ch.unige.regfund.zregfundgen2.OTPSelectDialog");
                var t = sap.ui.getCore().byId( this._keyfragmenrt1 +  "--ch.unige.regfund.zregfundgen2.OTPSelectDialog");
                // get WBE Selected     
                var oWBE = t.getSelectedItem().getBindingContext("ZSB_WBSELEMENTDATA_REG_FG").getObject();


                //get JSON Model 
                var oRegularize = sap.ui.getCore().getModel("Regularize");
                var oRegularizeLines = oRegularize.getProperty("/toItems");

                //set value selected for the Line selected in the Json model  
                oRegularizeLines[this._index].Wbselement = oWBE.WBSElementExternalID + " " + '-' + " " + oWBE.WBSDescription;

                // get tableModel and syncronize with  Json model  
                var tableModel = this.getView().getModel("Regularize");
                tableModel.updateBindings(true);

                this.dialog.close();
            },


            //////////////////////// Account  Filter ///////////////////////


            onCONFilterSelect: function (oEvent) {

                var t = oEvent.getSource().getBindingContext("Regularize").getPath();
                this._index = t.substr(t.length - 1);


                if (!this.dialogACC) {
                    this.dialogACC = sap.ui.xmlfragment( this._keyfragmenrt2,          //"idFragment_CON", 
                                                        "ch.unige.regfund.zregfundgen2.ext.fragment.CON", this);

                    this.getView().addDependent(this.dialogACC);

                }
                this.dialogACC.open();
                return this.dialogACC;
            },


            onCONCancelButtonPress: function () {
                this.dialogACC.close();   // First: close fragment
                // this.dialogACC.destroy(); //Second: destoy fragment 
                // this.dialogACC=null;      // Third: null name/pointer 
            },


            onCONSearch: function (e) {
                var fragmentID = this._keyfragmenrt2 + "--ch.unige.regfund.zregfundgen2.CONSelectDialog"; //"idFragment_CON--ch.unige.regfund.zregfundgen2.CONSelectDialog";
                var array_filter = ["GLAccount", "GLAccount_Text"];
                this._onCompteSearch(e, fragmentID, array_filter)
            },


            _onCompteSearch: function (e, fragmentID, array_filter) {
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

                r.bindAggregation("items", { model: i.model, path: i.path, parameters: i.parameters, template: i.template, filters: n });
            },


            onCONOkButtonPress: function (e) {
                //var t = sap.ui.getCore().byId("idFragment_CON--ch.unige.regfund.zregfundgen2.CONSelectDialog");
                var t = sap.ui.getCore().byId(this._keyfragmenrt2 + "--ch.unige.regfund.zregfundgen2.CONSelectDialog");
                // get Compte Selected     
                var oCON = t.getSelectedItem().getBindingContext("Z_BUDGET_ACCOUNT_SBIND").getObject();

                //get JSON Model 
                var oRegularize = sap.ui.getCore().getModel("Regularize");
                var oRegularizeLines = oRegularize.getProperty("/toItems");

                //set value selected for the Line selected in the Json model  
                oRegularizeLines[this._index].Compte = oCON.GLAccount;
                oRegularizeLines[this._index].Txt = oCON.GLAccount_Text;


                // get tableModel and syncronize with  Json model  
                var tableModel = this.getView().getModel("Regularize");
                tableModel.updateBindings(true);

                this.dialogACC.close();

            },

             ///// Add Row ////////////////////////

            addRow: function (e) {
                let oContexte = e.getSource().getBindingContext();
            //  let oContext = e.getSource().getBindingContext("Regularize");
                let oData = oContexte.getObject();

                //get JSON Model 
                var oRegularize = sap.ui.getCore().getModel("Regularize");
                var oRegularizeLines = oRegularize.getProperty("/toItems");

                var oRegularizeLine = {};


                oRegularizeLine.Documentnumber = oData.DocumentNumber;
                oRegularizeLine.Societe = oData.CompanyCode;
                oRegularizeLine.Gjahr = oData.FiscalYear;

                oRegularizeLine.Centre = '';


                var indexr =   oData.Compte;
                var ret = indexr.replace(' -','');
                var compte_idx =  indexr.split(" - ")[0];
                oRegularizeLine.Compte = compte_idx ; // ret ; //'';

                oRegularizeLine.Txt =  indexr.split(" - ")[1];

               


                oRegularizeLine.Divise = oData.Divise;
                oRegularizeLine.Montant = '0.00';
                oRegularizeLine.Wbselement = '';
               

                oRegularizeLines.push(oRegularizeLine);

                oRegularize.refresh();

            },

            ///// Delete Row ////////////////////////     
            deleteRow: function (e) {

      
             var t_Path = e.getSource().getBindingContext("Regularize").getPath();
             var indexr = t_Path.split("/")[2];
 

                //get JSON Model 
                var oRegularize = sap.ui.getCore().getModel("Regularize");
                var oRegularizeLines = oRegularize.getProperty("/toItems");

                oRegularizeLines.splice(indexr, 1);
                oRegularize.refresh();

                this.refreshTotal();
            },

            onCalculateTotalItems: function (oEvent) {

                var total1 = 0;

                var t = oEvent.getSource().getBindingContext("Regularize").getPath();
                this._index = t.substr(t.length - 1);

                total1 = oEvent.getParameter("value");
                
                // to avoid NaN on the screen 
                if (total1 === "") {total1 = "0"}

                var result = (total1 - Math.floor(total1)) !== 0;
                if (!result) {
                    total1 = parseFloat(total1).toFixed(2);
                }

                //get JSON Model 
                var oRegularize = sap.ui.getCore().getModel("Regularize");
                var oRegularizeLines = oRegularize.getProperty("/toItems");

                //set value selected for the Line selected in the Json model  
                oRegularizeLines[this._index].Montant = total1;

                // calculate TOTAL
                var sTotal = 0.00;
                var Charnumber = 0.00;

                for (var r = 0; r < oRegularizeLines.length; r++) {

                    Charnumber = oRegularizeLines[r].Montant;
                    var number = Number.parseFloat(Charnumber);

                    sTotal = sTotal + number;
                }

                var oCurrencyFormat = NumberFormat.getCurrencyInstance({
                    currencyCode: false
                });
                  
                var tot_format = oCurrencyFormat.format(sTotal, oRegularizeLines[this._index].Divise); // returns ¥1,235
        
                this.byId("ch.unige.regfund.zregfundgen2txt.Total.Items").setText(tot_format);


            },



            refreshTotal: function () {
                   //get JSON Model 
                   var oRegularize = sap.ui.getCore().getModel("Regularize");
                   var oRegularizeLines = oRegularize.getProperty("/toItems");
   

 
                  // calculate TOTAL
                  var sTotal = 0.00;
                  var sDivise = "";
                  var Charnumber = 0.00;


                  var oCurrencyFormat = NumberFormat.getCurrencyInstance({
                    currencyCode: false
                  });


                  for (var r = 0; r < oRegularizeLines.length; r++) {

                      Charnumber = oRegularizeLines[r].Montant;
                      var number = Number.parseFloat(Charnumber);

                      sTotal = sTotal + number;

                      sDivise = oRegularizeLines[r].Divise;

                  }
             
                
                  var tot_format = oCurrencyFormat.format(sTotal, sDivise); // returns ¥1,235
            
          
                  // Total de la Demande -> Defaul = valuer de la pièce + Total Items
                  var oTotal = sap.ui.getCore().getModel("Total");
 
       
                  oTotal.setProperty("/Total",  tot_format);
  
  
                  oRegularize.refresh();
 
              },

              /** Overflow Toolbar begin */
              /**
              * Sort Table records
              * @param {}        
              **/
  
              onSort: function (oEvent) {
                this.bDescending = !this.bDescending;
                this.fnApplyFiltersAndOrdering();
              },

              /**
              * Filter Table
              * @param {}        
              **/
              onFilter: function (oEvent) {
                this.sSearchQuery = oEvent.getSource().getValue();
                this.fnApplyFiltersAndOrdering();
              },
          
              /**
              * Group Table
              * @param {}        
              **/
              onGroup: function (oEvent){
                this.bGrouped = !this.bGrouped;
                this.fnApplyFiltersAndOrdering();
              },



              fnApplyFiltersAndOrdering: function (oEvent){
                var aFilters = [],
                  aSorters = [];
          
                if (this.bGrouped) {
                  aSorters.push(new Sorter("Compte", this.bDescending, this._fnGroup));
                } else {
                  aSorters.push(new Sorter("Wbselement", this.bDescending));
                }
          
                if (this.sSearchQuery) {
                  var oFilter = new Filter("Wbselement", FilterOperator.Contains, this.sSearchQuery);
                  aFilters.push(oFilter);
                }
          
                this.byId("ch.unige.regfund.zregfundgen2.Items.Table").getBinding("items").filter(aFilters).sort(aSorters);
              },

              /**
              * Export data into Spreadsheet
              * @param {object} oEvent The event
              * @public
              **/

              onExport: function() {
                var aCols, oRowBinding, oSettings, oSheet, oTable;
          
                if (!this._oTable) {
                  this._oTable = this.byId('ch.unige.regfund.zregfundgen2.Items.Table');
                }
          
                oTable = this._oTable;
                oRowBinding = oTable.getBinding('items');
                aCols = this.createColumnConfig();
          
                oSettings = {
                  workbook: {
                    columns: aCols,
                    hierarchyLevel: 'Level'
                  },
                  dataSource: oRowBinding,
                  fileName: 'Table.xlsx',
                  worker: false // We need to disable worker because we are using a MockServer as OData Service
                };
          
                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function() {
                  oSheet.destroy();
                });
              },

              /**
              * Create Table columns
              * @public
              **/
              createColumnConfig: function() {
                var aCols = [];
 
          
                aCols.push({
                  label: 'Document',
                  type: EdmType.String,
                  property: 'Documentnumber' 
              
                });


                aCols.push({
                  label: 'Exercise',
                  type: EdmType.String,
                  property: 'Gjahr' 
              
                });


                aCols.push({
                  label: 'Compte général',
                  type: EdmType.String,
                  property: 'Compte' 
              
                });
          

                aCols.push({          //OK
                  property: 'Montant',
                  type: EdmType.Number,
                  scale: 0
                });
          
                aCols.push({          //OK
                  label: 'Divise',
                  property: 'Divise',
                  type: EdmType.String
                   
                });
 

                aCols.push({
                  label: 'Compte général Txt ',
                  property: 'Txt',
                  type: EdmType.String
                });
          
                aCols.push({   //ok
                  label: 'El. OTP',
                  property: 'Wbselement',
                  type: EdmType.String,
                });
          
   
                return aCols;
              },


               /** Overflow Toolbar END */

            /***********************************************************************************************************/
            /*                                    ↓ ATTACHMENTS-RELATED FUNCTIONS ↓                                    */
            /***********************************************************************************************************/

            onBeforeUploadStarts: function (oEvent) {
              const  oUploadSet = oEvent.getSource();
              const fileName = oEvent.getParameter("item").getFileName();
              const slug =    fileName;
 
              const  crsfToken =  this.getOwnerComponent().getModel().getSecurityToken();


              oUploadSet.removeAllHeaderFields();

              oUploadSet.addHeaderField(
                  new sap.ui.core.Item({
                   key: "slug",
                  text: slug
                }));

              oUploadSet.addHeaderField(
                new sap.ui.core.Item({
                    key: "x-csrf-token",
                    text: crsfToken
                }));

 

   
            },


            onUploadCompleted: function (oEvent) {
                var oStatus = oEvent.getParameter("status"),
                    oItem = oEvent.getParameter("item"),
                    oUploadSet = this.getView().byId("UploadSet");

             //   if (oStatus && oStatus !== 200) {
             //       oItem.setUploadState("Error");
              //       oItem.removeAllStatuses();
             //      } else {
                //  oUploadSet.removeIncompleteItem(oItem);

                    //get file component
                    // needed to bind data to the Promise/Then function
                    this.oFileUploadComponent = oEvent.getParameters("items").item.getFileObject();


                    if (this.oFileUploadComponent) {

                    // getFileTypes
                    // getHeaderFields
                        
                        // needed to bind data to the Promise/Then function

                            debugger;

                             this._getBase64File(this.oFileUploadComponent).then(function(data) {
                            //var my_file = data.replace('data:application/pdf;base64,','');
                             const myArray=  data.split("data:application/pdf;base64,");  
                            var my_file = myArray[1];

                            var oRegularize = sap.ui.getCore().getModel("Regularize");
                            var oRegularizeFiles = oRegularize.getProperty("/toFiles");
                            this._Societe = oRegularize.getProperty("/Societe");
                   
                            

                            var now = new Date();
                            var oAttachment = {
                                "Attachmentid":    now.getHours().toString() + now.getMinutes().toString() + now.getSeconds().toString() + now.getMilliseconds().toString(),
                                "Societe":         oRegularize.getProperty("/Societe"),
                                "Documentnumber":  oRegularize.getProperty("/Documentnumber"),
                                "Gjahr":           oRegularize.getProperty("/Gjahr"), 
                                "Filename":         this.oFileUploadComponent.name,
                                "Mimetype": 'application/pdf' , //this.oFileUploadComponent.mimetype,
                                "Url": "",
                                "Description": "",
                                "Filecontent":  my_file //data
                            }; 
    
                            oRegularizeFiles.push(oAttachment);
                   

                            oRegularize.refresh();
                            
                        }.bind(this));

                        //call function to buil buffer
                        ////this._handleRawFile(this.oFileUploadComponent, this);
                    }
                    //get buffer
                    //// this.uploadFileRaw; // this is raw file then you can do what ever you want
                    //// this.setAttachment2Model(this.uploadFileRaw);

                //// this.setAttachment2Model(test);
               //    }
            },
      

            /**
             * Read a file and get its BASE64 content
             * @param {object} oFile The file as been uploaded
             * @param {oController The result of the reading as a Promise
             * @private
             * */
            _handleRawFile: function (oFile, oController) {
                //handle file data
                var oFileRaw = {
                    name: oFile.name,
                    mimetype: oFile.type,
                    size: oFile.size,
                    data: []
                };
                //reader
                // var aUploadFiles = [];
                var reader = new FileReader();
                reader.onload = function (e) {
                    oFileRaw.data = e.target.result; //set buffer data
                    oController.uploadFileRaw = oFileRaw;
                }.bind(oController);
                reader.readAsArrayBuffer(oFile);
            },

            /**
             * Read a file and get its BASE64 content
             * @param {object} iFile The file as sent by an HTML file input
             * @return {Promise} The result of the reading as a Promise
             * @private
             * */
            _getBase64File: function(iFile) {
                return new Promise(function(resolve, reject) {
                    var reader = new FileReader();
                    reader.readAsDataURL(iFile);
                    reader.onload = function() {
                        resolve(reader.result);
                    };
                    reader.onerror = function(error) {
                        reject(error);
                    };
                });
            }

 
    }
});